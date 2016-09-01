'use strict';

const ParameterizedStopsGenerator = require('../lib/ParameterizedStopsGenerator.js');

var generator = new ParameterizedStopsGenerator('input_data/region_cells.csv');
generator.generate();
