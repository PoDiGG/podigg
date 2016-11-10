'use strict';

const Config = require('../util/Config.js');
const RoutesGenerator = require('./RoutesGenerator.js');

class RandomRoutesGenerator extends RoutesGenerator {
    constructor(region, edges, config) {
        super(region, edges);

        var param_scope = "routes:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_routes = Config.value(config, param_scope + 'routes', 4500); // The number of routes to generate
        this.param_max_route_length = Config.value(config, param_scope + 'max_route_length', 50); // The maximum route length in number of edges
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        for (var i = 0; i < this.param_routes; i++) {
            var point = this.region.points[Math.floor(this.random() * this.region.points.length)];
            while (!this.region.isStation(point.x, point.y)) {
                point = this.region.points[Math.floor(this.random() * this.region.points.length)];
            }
            var stop = this.region.getRaw(point.x, point.y);

            var required_edges = this.random() * this.param_max_route_length + 1;
            var edges = stop.edges;
            var route_edges = [];
            while (route_edges.length < required_edges && edges.length > 0) {
                var chosenEdge = edges[Math.floor(this.random() * edges.length)];
                route_edges.push(chosenEdge);
            }
            if (route_edges.length > 0) {
                this.addRoute(route_edges);
            } else {
                i--;
            }
        }
        return this;
    }
}

module.exports = RandomRoutesGenerator;