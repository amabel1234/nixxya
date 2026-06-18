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

// 3. Function bundle — copy all dist-vercel files
const DIST_VERCEL = path.join(ROOT, 'artifacts', 'api-server', 'dist-vercel');
for (const file of fs.readdirSync(DIST_VERCEL)) {
  fs.copyFileSync(path.join(DIST_VERCEL, file), path.join(FUNC_DIR, file));
}

// 4. Function entry point (loads app.js from same dir, exposes init errors)
fs.writeFileSync(path.join(FUNC_DIR, 'index.js'), `'use strict';
let _app, _err;
try {
  const mod = require('./app.js');
  _app = mod.default || mod;
} catch (e) {
  _err = e;
  console.error('[nixx-api] Failed to load app.js:', e.message, e.stack);
}

module.exports = function(req, res) {
  if (_err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ initError: _err.message, code: _err.code, stack: (_err.stack||'').slice(0, 800) }));
    return;
  }
  return _app(req, res);
};
`);

// 5. Function config
fs.writeFileSync(path.join(FUNC_DIR, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
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
