'use strict';

const GtfsGenerator = require('../lib/GtfsGenerator');

/* Invoke the generator based on environment variables. */
GtfsGenerator.fromEnvironmentVariables().generate('output_data');
