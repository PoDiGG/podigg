'use strict';

/* An EdgesGenerator generates edges based on a given region that is populated with stops. */
class EdgesGenerator {
    constructor(region) {
        this.region = region;
        this.edges = [];
    }

    addEdge(point1, point2){
        var edge = { from: point1, to: point2 };
        this.edges.push(edge);
        this.region.markEdge(point1.x, point1.y, edge);
        this.region.markEdge(point2.x, point2.y, edge);
    }

    generate() {
        throw new Error('EdgesGenerator#generate() has not been implemented yet.');
    }

    getEdges() {
        return this.edges;
    }
}

module.exports = EdgesGenerator;