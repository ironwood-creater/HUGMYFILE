import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateFixtures } from './fixtures/generate.ts';

export default async function globalSetup() {
  if (!existsSync(join(process.cwd(), 'dist', 'index.html'))) {
    throw new Error('dist/ is missing. Run "npm run build" before the end-to-end tests.');
  }
  await generateFixtures();
}
