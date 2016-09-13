'use strict';

/* A StopsGenerator generates stops based on cell sizes of a given region, and stores those stops in the region. */
class StopsGenerator {
    constructor(region) {
        this.region = region;
    }

    generate() {
        throw new Error('StopsGenerator#generate() has not been implemented yet.');
    }
}

module.exports = StopsGenerator;