/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @silverhand/fp/no-mutating-methods */
/* eslint-disable @silverhand/fp/no-mutation */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateStandardId } from '@logto/shared';
import {
  type DatabaseTransactionConnection,
  type QueryResult,
  sql,
  type ValueExpression,
} from 'slonik';

import { insertInto } from '../../../../database.js';
import { consoleLog } from '../../../../utils.js';

export const getIdByQueryResult = <T extends { id: string }>(
  result: QueryResult<T>
): string | undefined => {
  if (result.rows[0] === undefined) {
    return undefined;
  }

  return result.rows[0].id;
};

export const getInsertedId = async (
  transaction: DatabaseTransactionConnection,
  tenantId: string | undefined,
  whereClauses: ValueExpression[],
  table: string
): Promise<string | undefined> => {
  if (tenantId !== undefined) {
    whereClauses.push(sql`tenant_id = ${tenantId}`);
  }
  const scope = await transaction.query<{ id: string }>(sql`
    select id from ${sql.identifier([table])}
      where ${sql.join(whereClauses, sql` AND `)}
      limit 1
  `);

  return getIdByQueryResult(scope);
};

export const createItem = async <
  T extends { id?: string } & Record<string, number | string | undefined | unknown[] | boolean>,
>(params: {
  transaction: DatabaseTransactionConnection;
  tenantId?: string;
  toInsert: T;
  toLogFieldName: string;
  itemTypeName: string;
  whereClauses: ValueExpression[];
  tableName: string;
}): Promise<Omit<T, 'id'> & { id: string }> => {
  const prefixConsoleEntry = `Creating ${params.itemTypeName}. TenantId: ${
    params.tenantId ?? 'NOT SET'
  }. Name: ${params.toInsert[params.toLogFieldName]!.toString()}`;
  consoleLog.info(prefixConsoleEntry);
  const scopeIdBefore = await getInsertedId(
    params.transaction,
    params.tenantId,
    params.whereClauses,
    params.tableName
  );
  if (scopeIdBefore !== undefined) {
    consoleLog.info(`${prefixConsoleEntry}. Already exists.`);
    params.toInsert.id = scopeIdBefore;
    return { ...params.toInsert, id: scopeIdBefore };
  }

  const toInsertData = {
    id: generateStandardId(),
    tenant_id: params.tenantId,
    ...params.toInsert,
  };

  await params.transaction.query(insertInto(toInsertData, params.tableName));
  params.toInsert.id = await getInsertedId(
    params.transaction,
    params.tenantId,
    params.whereClauses,
    params.tableName
  );
  if (params.toInsert.id !== undefined) {
    consoleLog.info(`${prefixConsoleEntry}. Created, Id ${params.toInsert.id}`);
    return { ...params.toInsert, id: params.toInsert.id };
  }

  throw new Error(`${prefixConsoleEntry}. Failure inserting it!`);
};
