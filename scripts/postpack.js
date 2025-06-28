import { copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const backupPath = path.join(process.cwd(), 'package.json.bak');

async function main() {
  // Restore the original package.json (with new version)
  await copyFile(backupPath, packageJsonPath);
  await unlink(backupPath);
  console.log('postpack: Restored original package.json');
}

main();
