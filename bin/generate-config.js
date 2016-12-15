#!/usr/bin/env node --harmony_destructuring
'use strict';

const GtfsGenerator = require('../lib/GtfsGenerator');
const fs = require('fs');

/* Invoke the generator based on a config file. */
var path = process.argv.length < 3 ? 'output_data' : process.argv[2];
var config = process.argv.length < 4 ? {} : JSON.parse(fs.readFileSync(process.argv[3]));
new GtfsGenerator(config).generate(path);