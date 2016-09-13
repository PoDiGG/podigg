'use strict';

const RoutesGenerator = require('./RoutesGenerator.js');

class RandomRoutesGenerator extends RoutesGenerator {
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
        // TODO
    }
}

module.exports = RandomRoutesGenerator;