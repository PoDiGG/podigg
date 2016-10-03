'use strict';

const Region = require('./Region');
const Point = require('../util/Point.js');

/* An RegionGenerator generates regions. */
class RegionGenerator {
    constructor() {
        this.region = new Region();

        this.param_seed = 1;
        this.param_size_x = 300;
        this.param_size_y = 300;
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    addPoint(x, y, value) {
        this.region.put(new Point(x, y, value));
    }

    generate() {
        throw new Error("generate is not implemented.");
    }

    getRegion() {
        return this.region;
    }
}

module.exports = RegionGenerator;