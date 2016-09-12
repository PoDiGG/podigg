'use strict';

const StopsGenerator = require('./StopsGenerator.js');
const Point = require('../lib/Point.js');
const DistanceHelpers = require('../lib/DistanceHelpers.js');
const _ = require('lodash');

class ParameterizedStopsGenerator extends StopsGenerator {
    constructor(region) {
        super(region);

        this.param_seed = 1; // Random seed
        this.param_stops = 600; // The number of stops to generate
        this.param_min_station_size = 0.01; // The minimum population density for a station to form
        this.param_max_station_size = 30; // The maximum population density for a station to form
        this.param_start_stop_choice_power = 4; // Higher values means higher chance on larger stations when selecting starting stations
        this.param_min_interstop_distance = 1; // The minimum distance between stops in number of cells.
        this.param_factor_stops_post_edges = 0.66;

        this.param_edge_choice_power = 2; // Higher values means higher chance on longer edges when selecting edges in the post step
        this.param_stop_around_edge_choice_power = 4;// Higher values means higher chance on larger stations when selecting stations on edges
        this.param_stop_around_edge_radius = 2; // The radius to select points from, from the random point on an edge
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    getRandomElementWeightedBySize(elements, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = this.random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        var randi = Math.floor(beta_left * elements.length);
        return elements[randi];
    }

    getRandomPointWeightedBySize() {
        return this.getRandomElementWeightedBySize(this.region.points, this.param_start_stop_choice_power);
    }

    hasStationInRegion(x, y, radius) {
        var points = this.region.getPointsInRegion(x, y, radius, 0);
        for (var pointI in points) {
            var point = points[pointI];
            if (this.region.isStation(point.x, point.y)) {
                return true;
            }
        }
        return false;
    }

    getPointsOnLine(point1, point2) {
        var intersections = [];
        intersections.push(new Point(point1.x, point1.y, this.region.getSize(point1.x, point1.y)));
        intersections.push(new Point(point2.x, point2.y, this.region.getSize(point2.x, point2.y)));
        var dy = point2.y - point1.y;
        var dx = point2.x - point1.x;
        var px = point1.x;
        var py = point1.y;

        // point 1 and 2 are the same
        if (dx == 0 && dy == 0) {
            return [ point1 ];
        }

        // Check if we have a vertical line
        var vertical = dx != 0;

        // y = slope * x + intersept
        var slope = dy / dx;
        var intersept = point1.y - (slope * point1.x);

        // Calculate intercepts of the line with hlines and vlines
        var xmax = Math.max(point1.x, point2.x);
        var xmin = Math.min(point1.x, point2.x);
        for (var x = xmin; x < xmax; x++) {
            var y = Math.floor(slope * x + intersept);
            var point = new Point(x, y, this.region.getSize(x, y));
            intersections.push(point);
        }
        var ymax = Math.max(point1.y, point2.y);
        var ymin = Math.min(point1.y, point2.y);
        for (var y = ymin; y < ymax; y++) {
            var x = vertical ? point1.x : Math.floor((y - intersept) / slope);
            var point = new Point(x, y, this.region.getSize(x, y));
            intersections.push(point);
        }

        return _.uniqBy(intersections, function (e) {
            return e.x - xmin + (e.y * xmax);
        });
    }

    generate() {
        for (var i = 0; i < this.param_stops * (1 - this.param_factor_stops_post_edges); i++) {
            var point = this.getRandomPointWeightedBySize();
            while (point.value < this.param_min_station_size || point.value > this.param_max_station_size || this.hasStationInRegion(point.x, point.y, this.param_min_interstop_distance)) {
                point = this.getRandomPointWeightedBySize();
            }
            this.region.markStation(point.x, point.y);
        }
    }

    addEdge(edges, from, to) {
        edges.push({
            from: from,
            to: to,
            edgeLength: DistanceHelpers.point2D(from, to)
        });
    }

    generatePostEdges(edges) {
        // Make sure all edges are annotated with their length
        edges.forEach(edge => {
            edge.edgeLength = DistanceHelpers.point2D(edge.from, edge.to);
        });

        for (var i = 0; i < this.param_stops * this.param_factor_stops_post_edges; i++) {
            // Sort edges by length (largest first) (new edges may have been added in last iteration
            edges.sort(function(a, b) {
                return a.edgeLength - b.edgeLength;
            });

            // Get random edge (A-B), weighted by edge length
            var edge = this.getRandomElementWeightedBySize(edges, this.param_edge_choice_power);
            var pointA = edge.from;
            var pointB = edge.to;

            // Get random point (C') on edge, weighted by size
            var pointsOnLine = this.getPointsOnLine(pointA, pointB).filter(point => {
                return (point.x != pointA.x || point.y != pointA.y) && (point.x != pointB.x || point.y != pointB.y);
            });
            pointsOnLine.sort(function(a, b) {
                return b.value - a.value;
            });
            var pointCs = this.getRandomElementWeightedBySize(pointsOnLine, this.param_edge_choice_power);

            if (pointCs) {
                // Get point (C) in area around C' with the largest size (skip stations) (area defined by edge length)
                var pointsAroundEdge = this.region.getPointsInRegion(pointCs.x, pointCs.y, this.param_stop_around_edge_radius, 0, false);
                var pointC = this.getRandomElementWeightedBySize(pointsAroundEdge, this.param_stop_around_edge_choice_power);

                if (pointC) {
                    // Mark C as station
                    this.region.markStation(pointC.x, pointC.y);

                    // Add two new edges (A-C, C-B)
                    this.addEdge(edges, pointA, pointC);
                    this.addEdge(edges, pointC, pointB);

                    // Remove original edge (A-B)
                    edges.splice(edges.indexOf(edge), 1);
                }
            }
        }
    }
}

module.exports = ParameterizedStopsGenerator;