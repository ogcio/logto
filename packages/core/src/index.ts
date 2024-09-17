import dotenv from 'dotenv';
import { findUp } from 'find-up';

dotenv.config({ path: await findUp('.env', {}) });

await import('./instrumentation.js');
await import('./main.js');
