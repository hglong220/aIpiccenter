/**
 * Fix Prisma generated imports by removing .js extensions
 */

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../lib/generated/prisma');
const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

function shouldProcess(filePath) {
  return FILE_EXTENSIONS.has(path.extname(filePath));
}

function fixImports(filePath) {
  if (!shouldProcess(filePath)) {
    return;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const updated = original.replace(/(['"]\.{1,2}\/[^'"\n]+?)\.js(['"])/g, '$1$2');

  if (original !== updated) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Fixed imports in ${path.relative(process.cwd(), filePath)}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      fixImports(fullPath);
    }
  }
}

function main() {
  if (!fs.existsSync(targetDir)) {
    console.log('Prisma generated directory not found, skip fixing.');
    return;
  }

  walk(targetDir);
  console.log('Prisma import paths fixed.');
}

main();
