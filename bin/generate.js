'use strict';

const RegionFactory = require('../lib/RegionFactory.js');
const ParameterizedStopsGenerator = require('../lib/ParameterizedStopsGenerator.js');
const TripsVisualizer = require('../lib/TripsVisualizer.js');

new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
    var generator = new ParameterizedStopsGenerator(region);
    generator.generate();

    new TripsVisualizer(region).render("edges.png");
});
