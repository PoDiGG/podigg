'use strict';

const EdgesGenerator = require('./EdgesGenerator.js');
const Point = require('../util/Point.js');

class RandomEdgesGenerator extends EdgesGenerator {
    constructor(region) {
        super(region);

        this.param_seed = 1; // Random seed
        this.param_edges = 600; // The number of edges to generate
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        for (var i = 0; i < this.param_edges; i++) {
            var point1 = this.region.points[Math.floor(this.random() * this.region.points.length)];
            while (!this.region.isStation(point1.x, point1.y)) {
                point1 = this.region.points[Math.floor(this.random() * this.region.points.length)];
            }
            var point2 = this.region.points[Math.floor(this.random() * this.region.points.length)];
            while (!this.region.isStation(point2.x, point2.y)) {
                point2 = this.region.points[Math.floor(this.random() * this.region.points.length)];
            }
            this.addEdge(point1, point2);
        }
    }
}

module.exports = RandomEdgesGenerator;