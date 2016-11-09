'use strict';

class Util {
    static getRandomElementWeightedBySize(random, elements, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        var randi = Math.floor(beta_left * elements.length);
        return elements[randi];
    }

    static stopToNamedId(stop) {
        return "stop_" + stop.x + "_" + stop.y;
    }
}

module.exports = Util;