'use strict';

class Util {
    static getRandomWeightedBySize(random, size, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        return Math.floor(beta_left * size);
    }

    static getRandomElementWeightedBySize(random, elements, power) {
        return elements[Util.getRandomWeightedBySize(random, elements.length, power)];
    }

    static stopToNamedId(stop) {
        return "stop_" + stop.x + "_" + stop.y;
    }

    static createChoicePool(distribution_map, factor) {
        if (!factor) factor = 100;
        var pool = [];
        Object.keys(distribution_map).forEach(key => {
            var chance = distribution_map[key];
            var amount = Math.ceil(chance * factor);
            for (var i = 0; i < amount; i++) {
                pool.push(key);
            }
        });
        return pool;
    }
}

Util.DEFAULT_DELAY_REASONS = {
    'http://purl.org/td/transportdisruption#DamagedVehicle': 0.4,
    'http://purl.org/td/transportdisruption#Strike': 0.2,
    'http://purl.org/td/transportdisruption#Accident': 0.2,
    'http://purl.org/td/transportdisruption#BadWeather': 0.1,
    'http://purl.org/td/transportdisruption#Obstruction': 0.1,
};

module.exports = Util;