'use strict';

const Config = require('../util/Config.js');
const RegionGenerator = require('./RegionGenerator');
const Region = require('./Region');
const DistanceHelpers = require('../util/DistanceHelpers');

/* An IsolatedRegionGenerator generates a region with isolated populations with different sizes. */
class IsolatedRegionGenerator extends RegionGenerator {
    constructor(config) {
        super(config);
        var param_scope = "region:";
        this.param_pop_clusters = Config.value(config, param_scope + 'pop_clusters', 50);
        this.param_pop_average = Config.value(config, param_scope + 'pop_average', 0);
        this.param_pop_deviation = Config.value(config, param_scope + 'pop_deviation', 10);
        this.param_max_radius = Config.value(config, param_scope + 'max_radius', 50);
    }

    generate() {
        for (var i = 0; i < this.param_pop_clusters; i++) {
            var value = Math.max(0, this.param_pop_average + this.param_pop_deviation - 2 * this.random() * this.param_pop_deviation);
            var x_center = Math.floor(this.random() * this.param_size_x);
            var y_center = Math.floor(this.random() * this.param_size_y);
            var radius = Math.floor(this.random() * this.param_max_radius);
            
            for (var x = x_center - radius; x < x_center + radius; x++) {
                for (var y = y_center - radius; y < y_center + radius; y++) {
                    var distance = DistanceHelpers.point2D({ x: x, y: y }, { x: x_center, y: y_center });
                    if (distance < radius) {
                        this.addPoint(x, y, value * (1 - distance / radius));
                    }
                }
            }
        }
        return this;
    }
}

module.exports = IsolatedRegionGenerator;