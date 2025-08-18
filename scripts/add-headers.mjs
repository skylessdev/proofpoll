#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const SPDX_HEADERS = {
  block: '/* SPDX-License-Identifier: (MIT OR MPL-2.0) */',
  line: '// SPDX-License-Identifier: (MIT OR MPL-2.0)',
  sql: '-- SPDX-License-Identifier: (MIT OR MPL-2.0)'
};

const SKIP_DIRS = [
  'node_modules', '.next', '.vercel', 'build', 'dist', 'coverage',
  'out', '.git', '.replit', 'attached_assets'
];

const SKIP_PATTERNS = [
  /\.d\.ts$/,
  /\.map$/,
  /\.min\./,
  /\.json$/,
  /\.ya?ml$/,
  /\.md$/,
  /LICENSE/i,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i
];

const TARGET_EXTENSIONS = {
  '.ts': 'block',
  '.tsx': 'block', 
  '.js': 'block',
  '.jsx': 'block',
  '.css': 'block',
  '.prisma': 'line',
  '.sql': 'sql'
};

// Patterns that must stay at the top of files
const TOP_LINE_PATTERNS = [
  /^#!/,                                    // shebang
  /^['"]use (client|server)['"];?\s*$/,     // Next.js directives
  /^\/\*\s*eslint-disable/,                 // eslint disable
  /^\/\/\s*@ts-/,                          // TypeScript pragmas
  /^\/\*\*\s*@jsxImportSource/,            // JSX import source
];

function shouldSkipPath(path) {
  const parts = path.split('/');
  return SKIP_DIRS.some(dir => parts.includes(dir)) ||
         path.includes('prisma/migrations/') ||
         SKIP_PATTERNS.some(pattern => pattern.test(path));
}

function getHeaderType(filePath) {
  const ext = extname(filePath);
  return TARGET_EXTENSIONS[ext];
}

function hasExistingHeader(content) {
  return content.includes('SPDX-License-Identifier') || 
         content.includes('Dual licensed');
}

function findSafeInsertionIndex(lines) {
  let index = 0;
  
  // Skip past any top-line patterns
  while (index < lines.length) {
    const line = lines[index].trim();
    
    // Skip empty lines at the top
    if (!line) {
      index++;
      continue;
    }
    
    // Check if this line matches any top-line pattern
    const matchesPattern = TOP_LINE_PATTERNS.some(pattern => pattern.test(line));
    
    if (matchesPattern) {
      index++;
      // Also skip any empty line immediately after the pragma
      if (index < lines.length && !lines[index].trim()) {
        index++;
      }
    } else {
      break;
    }
  }
  
  return index;
}

function addHeaderToFile(filePath, dryRun = false) {
  const headerType = getHeaderType(filePath);
  if (!headerType) return false;

  try {
    const content = readFileSync(filePath, 'utf8');
    
    if (hasExistingHeader(content)) {
      return false; // Already has header
    }

    const lines = content.split('\n');
    const insertIndex = findSafeInsertionIndex(lines);
    const header = SPDX_HEADERS[headerType];
    
    // Insert header with appropriate spacing
    const newLines = [
      ...lines.slice(0, insertIndex),
      header,
      ...lines.slice(insertIndex)
    ];
    
    // Add empty line after header if the next line isn't empty
    if (insertIndex < lines.length && lines[insertIndex].trim()) {
      newLines.splice(insertIndex + 1, 0, '');
    }
    
    const newContent = newLines.join('\n');
    
    if (!dryRun) {
      writeFileSync(filePath, newContent, 'utf8');
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, files = []) {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relativePath = fullPath.replace(projectRoot + '/', '');
      
      if (shouldSkipPath(relativePath)) continue;
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDirectory(fullPath, files);
      } else if (stat.isFile() && getHeaderType(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const shouldWrite = args.includes('--write');
  
  if (!dryRun && !shouldWrite) {
    console.log('Usage: node add-headers.mjs [--dry-run | --write]');
    console.log('  --dry-run: Show what would be changed');
    console.log('  --write:   Apply the changes');
    process.exit(1);
  }

  console.log(`${dryRun ? 'Analyzing' : 'Adding'} SPDX headers...`);
  
  const targetFiles = walkDirectory(projectRoot);
  let updatedCount = 0;
  let skippedCount = 0;
  
  const samples = [];
  
  for (const filePath of targetFiles) {
    const relativePath = filePath.replace(projectRoot + '/', '');
    const wasUpdated = addHeaderToFile(filePath, dryRun);
    
    if (wasUpdated) {
      updatedCount++;
      if (samples.length < 5) {
        samples.push(relativePath);
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`\nResults:`);
  console.log(`  Files ${dryRun ? 'that would be updated' : 'updated'}: ${updatedCount}`);
  console.log(`  Files skipped (already have headers): ${skippedCount}`);
  console.log(`  Total files examined: ${targetFiles.length}`);
  
  if (samples.length > 0) {
    console.log(`\nSample files ${dryRun ? 'to be updated' : 'updated'}:`);
    samples.forEach(file => console.log(`  - ${file}`));
  }
  
  if (dryRun && updatedCount > 0) {
    console.log(`\nRun with --write to apply changes.`);
  }
}

main();