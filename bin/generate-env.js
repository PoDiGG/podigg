#!/usr/bin/env node --harmony_destructuring
'use strict';

const GtfsGenerator = require('../lib/GtfsGenerator');
const fs = require('fs');

/* Invoke the generator based on environment variables. */
var path = process.argv.length < 3 ? 'output_data' : process.argv[2];
if (!fs.existsSync(path)) {
  fs.mkdirSync(path);
}
GtfsGenerator.fromEnvironmentVariables().generate(path);
