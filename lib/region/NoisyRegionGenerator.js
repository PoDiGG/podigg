'use strict';

const Config = require('../util/Config.js');
const RegionGenerator = require('./RegionGenerator');
const Region = require('./Region');
const Point = require('../util/Point.js');

/* A NoisyRegionGenerator generates a region with a noisy random population distribution. */
class NoisyRegionGenerator extends RegionGenerator {
    constructor(config) {
        super(config);
        var param_scope = "region:";
        this.param_pop_average = Config.value(config, param_scope + 'pop_average', 0);
        this.param_pop_deviation = Config.value(config, param_scope + 'pop_deviation', 10);
    }

    generate() {
        var prev = [];
        for (var x = 0; x < this.param_size_x; x++) {
            prev[x] = [];
            for (var y = 0; y < this.param_size_y; y++) {
                var value = Math.max(0, this.param_pop_average + this.param_pop_deviation - 2 * this.random() * this.param_pop_deviation);
                if (x > 0) value += prev[x - 1][y];
                if (y > 0) value += prev[x][y - 1];
                value /= (1 + (x > 0) + (y > 0));
                this.addPoint(x, y, value);
                prev[x][y] = value;
            }
        }
        return this;
    }
}

module.exports = NoisyRegionGenerator;