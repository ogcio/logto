import dotenv from 'dotenv';
import { Pool } from 'pg';
import QueryStream from 'pg-query-stream';
import { PassThrough, pipeline, Readable } from 'stream';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { promisify } from 'util';

import pkg from 'JSONStream';
import { performance } from 'perf_hooks';
import prettyMilliseconds from 'pretty-ms';
const JSONStream = pkg;

dotenv.config();

// Load env vars
const {
    ENABLE_AUDIT_CLEANER, NODE_ENV,
    POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB_NAME, POSTGRES_USER, POSTGRES_PASSWORD,
    RETENTION_DAYS, S3_BUCKET, S3_PREFIX, AWS_REGION,
    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN
} = process.env;

const checkEnv = () => {
    const requiredVars = [
        "POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DB_NAME", "POSTGRES_USER", "POSTGRES_PASSWORD",
        "RETENTION_DAYS", "S3_BUCKET", "S3_PREFIX", "AWS_REGION"
    ];

    return requiredVars.every((varName) => {
        if (!process.env[varName]) {
            console.log(`Audit Cleaner - Environment variable missing: ${varName}. Process execution denied.`);
            return false;
        }
        return true;
    });
}

const initPool = () => {
    return new Pool({
        host: POSTGRES_HOST,
        port: Number(POSTGRES_PORT),
        database: POSTGRES_DB_NAME,
        user: POSTGRES_USER,
        password: POSTGRES_PASSWORD,
    });
}

const initS3Client = () => {
    const config: S3ClientConfig = {
        region: AWS_REGION!,
    }

    if (NODE_ENV === "DEV") {
        config.credentials =  {
            accessKeyId: AWS_ACCESS_KEY_ID!,
            secretAccessKey: AWS_SECRET_ACCESS_KEY!,
            sessionToken: AWS_SESSION_TOKEN,
        };
    }

    return new S3Client(config);
}

const isCleanerEnabled = () => {
    return ENABLE_AUDIT_CLEANER === "true"
}

async function main() {
    if (!isCleanerEnabled() || !checkEnv()) {
        return;
    }

    const start = performance.now();
    const startDate = new Date();
    console.log(`Audit Cleaner - Start audit log cleanup at ${startDate.toISOString()}`);

    const pool = initPool();
    const client = await pool.connect();
    const s3 = initS3Client();

    try {
        await client.query('BEGIN');

        console.log("Audit Cleaner - Querying old logs");
        const count = await client.query(`
            SELECT count(*) FROM logs
            WHERE created_at < NOW() - make_interval(days => $1)`,
            [RETENTION_DAYS]
        );
        console.log(`Audit Cleaner - ${count.rows[0].count} entries found`);

        if (count.rows[0].count == 0) {
            console.log(`Audit Cleaner - Exiting due to no entries found for deletion`);
            return;
        }

        const sql = `SELECT tenant_id, id, key, payload, created_at
            FROM logs
            WHERE created_at < NOW() - make_interval(days => $1)`;

        const query = new QueryStream(sql, [RETENTION_DAYS]);
        const stream = client.query(query)

        const pipelineAsync = promisify(pipeline);

        // Wrap stream: open array, then JSON rows, then close array
        const openStream = Readable.from(['[']);
        const jsonRows = stream.pipe(JSONStream.stringify('', ',', ''));
        const closeStream = Readable.from([']']);

        // Build S3 key
        const timestamp = startDate.toISOString().replace(/[:.]/g, '');
        const key = `${S3_PREFIX}/audit-logs-${timestamp}.json`;
        console.log(`Audit Cleaner - Start uploading archives to s3://${S3_BUCKET}/${key} at ${new Date().toISOString()}`);
        
        // Combined stream using pipeline into a PassThrough stream
        const combinedStream = new PassThrough();

        (async () => {
            try {
                // Pipe each part sequentially into the combinedStream
                for (const part of [openStream, jsonRows, closeStream]) {
                    await pipelineAsync(part, combinedStream, { end: false });
                }
                combinedStream.end(); // manually close the stream when done piping
            } catch (err) {
                console.error('Audit Cleaner - Stream combination failed:', err);
                combinedStream.destroy(err as Error);
            }
        })();

        // Pipe JSON array start, rows, and array end into S3 multipart upload
        const upload = new Upload({
            client: s3,
            params: {
                Bucket: S3_BUCKET,
                Key: key,
                ContentType: 'application/json',
                Body: combinedStream
            },
            queueSize: 4,
            partSize: 5 * 1024 * 1024, // 5 MB per part
        });

        await upload.done();
        console.log(`Audit Cleaner - Uploaded archived logs to s3://${S3_BUCKET}/${key} at ${new Date().toISOString()}`);

        // Delete in batches
        const deleteQuery = new QueryStream(
            `DELETE FROM logs
            WHERE created_at < NOW() - make_interval(days => $1)
            RETURNING logs.id`,
            [RETENTION_DAYS]
        );
        const delStream = client.query(deleteQuery);
        let deletedCount = 0;
        for await (const _row of delStream) deletedCount++;
        console.log(`Audit Cleaner - Deleted ${deletedCount} rows from database.`);

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Audit Cleaner - Cleanup failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
        const end = performance.now();
        console.log(`Audit Cleaner - Process finished in ${prettyMilliseconds(end - start)} at ${new Date().toISOString()}`);
    }
}

main().catch(console.error);
