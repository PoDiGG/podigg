'use strict';

const RoutesGenerator = require('./RoutesGenerator.js');

class ParameterizedRoutesGenerator extends RoutesGenerator {
    constructor(region, edges) {
        super(region, edges);

        this.param_seed = 1; // Random seed
        this.param_routes = 100; // The number of routes to generate
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        // Create list L of all stops X% of the largest stops (TODO: indicate on map to see which ones are picked)
        // TODO: I may want to add a penalty to point sizes if another large station is in the area (don't penalize the largest point)

        // Make routes from all stops in L to all stops in L
            // For stop A and B

            // Get shortest path P over trips

            // Based on the total number of edges in this route, derive appropriate number of trips (always around the same amount, param)


        // TODO: check if all stops can be delivered this way
    }
}

module.exports = ParameterizedRoutesGenerator;