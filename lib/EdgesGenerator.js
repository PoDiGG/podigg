'use strict';

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