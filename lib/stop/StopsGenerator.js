'use strict';

class StopsGenerator {
    constructor(region) {
        this.region = region;
    }

    generate() {
        throw new Error('StopsGenerator#generate() has not been implemented yet.');
    }
}

module.exports = StopsGenerator;