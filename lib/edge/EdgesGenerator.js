'use strict';

/* An EdgesGenerator generates edges based on a given region that is populated with stops. */
class EdgesGenerator {
    constructor(region) {
        this.region = region;
        this.edges = [];
    }

    addEdge(point1, point2){
        var edge = { from: this.region.getRaw(point1.x, point1.y), to: this.region.getRaw(point2.x, point2.y) };
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