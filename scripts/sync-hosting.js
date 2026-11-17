const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NEXT_STATIC = path.join(ROOT, '.next', 'static');
const NEXT_SERVER_APP = path.join(ROOT, '.next', 'server', 'app');
const PUBLIC_DIR = path.join(ROOT, 'public');
const HOSTING_DIR = path.join(ROOT, '.firebase', 'studio-157276530-549e7', 'hosting');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('--- Syncing Build Assets to Firebase Hosting ---');

// 1. Copy public directory assets
if (fs.existsSync(PUBLIC_DIR)) {
  console.log('Copying public/ to hosting...');
  copyRecursiveSync(PUBLIC_DIR, HOSTING_DIR);
}

// 2. Copy .next/static to hosting/_next/static
if (fs.existsSync(NEXT_STATIC)) {
  console.log('Copying .next/static to hosting/_next/static...');
  const targetStatic = path.join(HOSTING_DIR, '_next', 'static');
  copyRecursiveSync(NEXT_STATIC, targetStatic);
}

// 3. Copy HTML and RSC files from .next/server/app to hosting
if (fs.existsSync(NEXT_SERVER_APP)) {
  console.log('Copying compiled HTML pages from .next/server/app...');
  
  function processAppDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        processAppDir(fullPath);
      } else {
        const rel = path.relative(NEXT_SERVER_APP, fullPath);
        // We care about .html, .rsc, .json
        if (rel.endsWith('.html') || rel.endsWith('.rsc') || rel.endsWith('.meta')) {
          const destFile = path.join(HOSTING_DIR, rel);
          const destDir = path.dirname(destFile);
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(fullPath, destFile);

          // If it's a page .html (and not index.html), also ensure path/index.html exists for cleanUrls
          if (rel.endsWith('.html') && rel !== 'index.html') {
            const cleanRel = rel.replace(/\.html$/, '');
            const folderIndex = path.join(HOSTING_DIR, cleanRel, 'index.html');
            const folderDir = path.dirname(folderIndex);
            if (!fs.existsSync(folderDir)) fs.mkdirSync(folderDir, { recursive: true });
            fs.copyFileSync(fullPath, folderIndex);
          }
        }
      }
    }
  }

  processAppDir(NEXT_SERVER_APP);
}

console.log('✓ Successfully synced static build assets to Firebase Hosting!');
