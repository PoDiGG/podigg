'use strict';

const RegionFactory = require('../lib/RegionFactory.js');
const TripsVisualizer = require('../lib/TripsVisualizer.js');

const ParameterizedStopsGenerator = require('../lib/ParameterizedStopsGenerator.js');
const RandomStopsGenerator = require('../lib/RandomStopsGenerator.js');

// Generate stops based on population distribution
new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
    new ParameterizedStopsGenerator(region).generate();
    new TripsVisualizer(region).render("stops_parameterized.png");
});

// Generate stops at random
new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
    new RandomStopsGenerator(region).generate();
    new TripsVisualizer(region).render("stops_random.png");
});

// Load golden standard of stops
new RegionFactory('input_data/region_cells.csv', true).createRegion((region) => {
    new TripsVisualizer(region).render("stops_gs.png");
});

// TODO:
// Add function to region to get stop list
// Compare the two stop lists with the golden standard (calculate distance)
