'use strict';

const RegionFactory = require('../lib/RegionFactory.js');
const TripsVisualizer = require('../lib/TripsVisualizer.js');

const ParameterizedStopsGenerator = require('../lib/ParameterizedStopsGenerator.js');
const RandomStopsGenerator = require('../lib/RandomStopsGenerator.js');

new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
    new ParameterizedStopsGenerator(region).generate();
    new TripsVisualizer(region).render("stops_parameterized.png");
});

new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
    new RandomStopsGenerator(region).generate();
    new TripsVisualizer(region).render("stops_random.png");
});
