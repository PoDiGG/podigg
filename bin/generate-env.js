'use strict';

const GtfsGenerator = require('../lib/GtfsGenerator');

/* Invoke the generator based on environment variables. */
var path = process.argv.length < 3 ? 'output_data' : process.argv[2];
GtfsGenerator.fromEnvironmentVariables().generate(path);
