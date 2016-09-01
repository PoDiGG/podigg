'use strict';

const StopsGenerator = require('./StopsGenerator.js');
const Point = require('../lib/Point.js');

class ParameterizedStopsGenerator extends StopsGenerator {
    constructor(region) {
        super(region);

        this.param_seed = 1; // Random seed
        this.param_stops = 100; // The number of stops to generate
        this.param_min_station_size = 0.01; // The minimum population density for a station to form
        this.param_start_stop_choice_power = 4; // Higher values means higher chance on larger stations when selecting starting stations
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    getRandomElementWeightedBySize(elements, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = this.random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        var randi = Math.floor(beta_left * elements.length);
        return elements[randi];
    }

    getRandomPointWeightedBySize() {
        return this.getRandomElementWeightedBySize(this.region.points, this.param_start_stop_choice_power);
    }

    generate() {
        for (var i = 0; i < this.param_stops; i++) {
            var point = this.getRandomPointWeightedBySize();
            while (point.value < this.param_min_station_size) {
                point = this.getRandomPointWeightedBySize();
            }
            this.region.markStation(point.x, point.y);
        }
    }
}

module.exports = ParameterizedStopsGenerator;