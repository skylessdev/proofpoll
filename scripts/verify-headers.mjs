#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const REQUIRED_SPDX_IDENTIFIER = 'SPDX-License-Identifier: (MIT OR MPL-2.0)';

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

const TARGET_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.prisma', '.sql'];

function shouldSkipPath(path) {
  const parts = path.split('/');
  return SKIP_DIRS.some(dir => parts.includes(dir)) ||
         path.includes('prisma/migrations/') ||
         SKIP_PATTERNS.some(pattern => pattern.test(path));
}

function isTargetFile(filePath) {
  const ext = extname(filePath);
  return TARGET_EXTENSIONS.includes(ext);
}

function checkFileHeader(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return content.includes(REQUIRED_SPDX_IDENTIFIER);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
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
      } else if (stat.isFile() && isTargetFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

function main() {
  console.log('Verifying SPDX headers in source files...');
  
  const targetFiles = walkDirectory(projectRoot);
  const missingHeaders = [];
  let checkedCount = 0;
  
  for (const filePath of targetFiles) {
    const relativePath = filePath.replace(projectRoot + '/', '');
    const hasHeader = checkFileHeader(filePath);
    
    checkedCount++;
    
    if (!hasHeader) {
      missingHeaders.push(relativePath);
    }
  }
  
  console.log(`\nResults:`);
  console.log(`  Files checked: ${checkedCount}`);
  console.log(`  Files with correct SPDX headers: ${checkedCount - missingHeaders.length}`);
  console.log(`  Files missing SPDX headers: ${missingHeaders.length}`);
  
  if (missingHeaders.length > 0) {
    console.log(`\nFiles missing SPDX headers:`);
    missingHeaders.forEach(file => console.log(`  - ${file}`));
    console.log(`\nRequired header: ${REQUIRED_SPDX_IDENTIFIER}`);
    process.exit(1);
  } else {
    console.log(`\n✅ All source files have correct SPDX headers!`);
    process.exit(0);
  }
}

main();