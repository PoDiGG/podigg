'use strict';

/* An EdgesGenerator generates edges (~trips) based on a given region that is populated with stops. */
class EdgesGenerator {
    constructor(region) {
        this.region = region;
        this.edges = [];
    }

    addEdge(point1, point2){
        this.edges.push({ from: point1, to: point2 });
    }

    generate() {
        throw new Error('EdgesGenerator#generate() has not been implemented yet.');
    }

    getEdges() {
        return this.edges;
    }
}

module.exports = EdgesGenerator;