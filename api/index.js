'use strict';
// Load the pre-built CJS Express bundle
const mod = require('../artifacts/api-server/dist-vercel/app.js');
const app = mod.default || mod;
module.exports = app;
