import dotenv from 'dotenv';
import { findUp } from 'find-up';

dotenv.config({ path: await findUp('.env', {}) });

// OGCIO
await import('./instrumentation.js');
await import('./main.js');
