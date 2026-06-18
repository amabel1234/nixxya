import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, '.vercel', 'output');

console.log('Building Vercel output directory...');

// Clean
fs.rmSync(OUTPUT, { recursive: true, force: true });

// Create structure
const STATIC_DIR = path.join(OUTPUT, 'static');
const FUNC_DIR = path.join(OUTPUT, 'functions', 'api', 'index.func');
fs.mkdirSync(STATIC_DIR, { recursive: true });
fs.mkdirSync(FUNC_DIR, { recursive: true });

// 1. Routing config
fs.writeFileSync(path.join(OUTPUT, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api/index' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ]
}, null, 2));

// 2. Static frontend files
const STATIC_SRC = path.join(ROOT, 'artifacts', 'nixx-ai', 'dist', 'public');
copyDir(STATIC_SRC, STATIC_DIR);
console.log('✓ Static files copied');

// 3. Function entry point - Lambda-style handler test (no imports, no app.js)
fs.writeFileSync(path.join(FUNC_DIR, 'index.js'), `'use strict';
module.exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true, msg: 'lambda-style-works', node: process.version })
  };
};
`);

// 4. Function config — Lambda style (no launcherType)
fs.writeFileSync(path.join(FUNC_DIR, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.handler',
  maxDuration: 30,
  memory: 1024
}, null, 2));

console.log('✓ Function bundle created');
console.log('✓ Vercel Build Output API v3 complete');

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
