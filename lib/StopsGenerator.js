'use strict';

const Region = require('../lib/Region.js');

class StopsGenerator {
    constructor() {
        this.region = new Region();
    }

    generate() {
        throw new Error('StopsGenerator#generate() has not been implemented yet.');
    }

    getPoints() {
        throw new Error('StopsGenerator#getPoints() has not been implemented yet.');
    }
}

module.exports = StopsGenerator;