'use strict';

const Config = require('../util/Config.js');
const RoutesGenerator = require('./RoutesGenerator.js');
const DistanceHelpers = require('../util/DistanceHelpers');
const winston = require('winston');
const aStar = require('armillary').aStar;
const readline = require('readline');

class ParameterizedRoutesGenerator extends RoutesGenerator {
    constructor(region, edges, config) {
        super(region, edges, config);

        var param_scope = "routes:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_routes = Config.value(config, param_scope + 'routes', 4500); // The number of routes to generate
        this.param_largest_stations_fraction = Config.value(config, param_scope + 'largest_stations_fraction', 0.05); // The fraction of (largest) stations inbetween which routes need to be formed.
        this.param_penalize_station_size_area = Config.value(config, param_scope + 'penalize_station_size_area', 10); // The area in which station sizes should be penalized.
        this.param_max_route_length = Config.value(config, param_scope + 'max_route_length', 10); // The maximum number of edges a route can have, the larger, the slower this generator.
        this.param_min_route_length = Config.value(config, param_scope + 'min_route_length', 4); // The minimum number of edges a route must have.
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        // Create list L of all stops X% of the largest stops (the station size of nearby stations are penalized, except for the largest one)
        var stations = this.region.getStations();
        stations.forEach(station => {
            var stationsInRegion = this.region.getPointsInRegion(station.x, station.y, this.param_penalize_station_size_area, 0, true).sort((a, b) => {
                return b.value - a.value;
            });
            if (stationsInRegion.length > 0 && station.value < stationsInRegion[0].value && (station.x !== stationsInRegion[0].x || station.y !== stationsInRegion[0].y)) {
                station.value = 0;
            } else {
            }
        });
        stations = stations.sort((a, b) => {
            return b.value - a.value;
        });
        stations = stations.slice(0, Math.ceil(stations.length * this.param_largest_stations_fraction));

        // Annotate stations with direct references to their data points
        stations.forEach(station => {
            station.realPoint = this.region.getRaw(station.x, station.y);
        });

        // ---------- STEP 1: Micro-routes ----------
        winston.log('info', 'Creating micro-routes');
        // These routes consist of trips that directly correspond to edges.

        // Make routes from all stops in L to all stops in L
        process.stdout.write("0 / " + stations.length);
        for (var i = 0; i < stations.length; i++) {
            var station1 = stations[i];
            readline.clearLine(process.stdout);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write("\r" + i + " / " + stations.length);
            for (var j = 0; j < i; j++) {
                // For stop A and B
                var station2 = stations[j];

                // Get shortest path P over edges
                var path = this.getShortestPath(station1.realPoint, station2.realPoint, null, null, this.param_max_route_length);
                if (path && path.length > 0) {
                    path.forEach(edge => edge.passed = true);
                    this.addRoute(path);
                }
            }
        }
        process.stdout.write("\n");

        // Build routes for each edge that has not been passed yet.
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i];
            if (!edge.passed) {
                var path = this.buildPathFromEdge(edge, this.param_max_route_length);
                this.addRoute(path);
            }
        }

        // Loop over all edges, and if if len < this.param_min_route_length, merge with a connected edge
        for (var i = this.routes.length - 1; i >= 0 ; i--) {
            var route = this.routes[i];
            if (route.edges.length < this.param_min_route_length) {
                var newRoute = this.getClosestConnectedRoute(route);
                if (newRoute) {
                    this.routes.splice(i, 1);
                    route.edges.forEach(edge => {
                        edge.route = newRoute;
                        newRoute.edges.push(edge);
                    });
                }
            }
        }

        // For all currently available routes, add all edges as trips
        this.routes.forEach(route => route.trips = route.edges.concat([]));

        // ---------- STEP 2: Macro-routes ----------
        winston.log('info', 'Creating macro-routes');
        // These routes consist of trips that consist of multiple edges.
        while (this.routes.length < this.param_routes) {
            // Get 2 random (large) stations, A and B
            var stop1 = stations[Math.floor(stations.length * this.random())].realPoint;
            var stop2 = stations[Math.floor(stations.length * this.random())].realPoint;

            // L = A
            var stopLoop = stop1;

            // While L != B
            var passedStops = [ stop1 ];
            var passedEdges = [];
            while (stopLoop !== stop2) {
                // Select edge from L that is 'most in the direction of B'
                var edges = stopLoop.edges.filter(edge => passedEdges.indexOf(edge) < 0);
                var edge = this.getEdgeInDirectionOf(edges, stopLoop, stop2, passedStops);
                if (!edge) break;
                passedEdges.push(edge);

                // Mark L as other end of the selected edge
                stopLoop = this.getOtherEndOfEdge(edge, stopLoop);

                // Add L to list
                passedStops.push(stopLoop);
            }

            // Sort stops by size
            var passedStopsSizeSorted = passedStops.concat([]);
            passedStopsSizeSorted.sort((a, b) => b.size - a.size);

            // Select (rand: this.param_max_route_length ~ this.param_min_route_length) stops
            passedStopsSizeSorted = passedStopsSizeSorted.slice(0, Math.min(passedStops.length, Math.floor(this.param_min_route_length + (this.param_max_route_length - this.param_min_route_length) * this.random())));
            if (passedStopsSizeSorted.length >= this.param_min_route_length) {
                passedStops = passedStops.filter(stop => passedStopsSizeSorted.indexOf(stop) >= 0);

                // Create trips for the selected stops
                var trips = [];
                for (var i = 0; i < passedStops.length - 1; i++) {
                    var trip = { from: passedStops[i], to: passedStops[i + 1] };
                    trips.push(trip);
                    this.edges.push(trip);
                }

                // Save trips as new route
                this.addRouteRaw(trips, trips);
            }
        }
        return this;
    }

    getShortestPathSlow(point1, point2, passedPoints, passedEdges, maxSteps) {
        if (!passedPoints) passedPoints = [];
        if (!passedEdges) passedEdges = [];
        if (maxSteps === 0) return null;
        if (point1 == point2) {
            return passedEdges;
        }
        var edges = point1.edges.filter(edge => passedEdges.indexOf(edge) < 0);
        var shortestPath = null;
        for (var i = 0; i < edges.length; i++) {
            var edge = edges[i];
            //var newPassedStation = newPassedPoints.indexOf(edge.to) < 0 ? edge.to : (newPassedPoints.indexOf(edge.to) < 0 ? edge.from : null);
            var newPassedStation = this.getOtherEndOfEdge(edge, point1);
            if (newPassedStation) {
                var path = this.getShortestPathSlow(point2, newPassedStation, passedPoints.concat([point1]), passedEdges.concat([edge]), maxSteps ? (shortestPath ? Math.min(maxSteps - 1, shortestPath.length) : maxSteps - 1) : (shortestPath ? shortestPath.length : null));
                if (path && (!shortestPath || path.length < shortestPath.length)) {
                    shortestPath = path;
                }
            }
        }
        return shortestPath;
    }

    getShortestPath(point1, point2, passedPoints, passedEdges, maxSteps) {
        var { success: success, cause: cause, path: path, distance: distance } = aStar({
            start: point1,
            end: point2,
            neighbors: (node) => {
                return node.edges.reduce((acc, el) => {
                    var node2 = this.getOtherEndOfEdge(el, node);
                    if (node2) {
                        acc.push(node2);
                    }
                    return acc;
                }, []);
            },
            maxDistance: maxSteps
        });
        if (success) {
            var edges = [];
            for (var i = 0; i < path.length - 1; i++) {
                var node1 = path[i];
                var node2 = path[i + 1];
                var edge = null;
                for (var j = 0; j < node1.edges.length; j++) {
                    var node2_opt = this.getOtherEndOfEdge(node1.edges[j], node1);
                    if (node2_opt === node2) {
                        edge = node1.edges[j];
                        break;
                    }
                }
                edges.push(edge);
            }
            return edges;
        }
        return null;
    }

    buildPathFromEdge(edge, maxSteps, passedEdges) {
        if (!passedEdges) passedEdges = [edge];
        var newEdge;
        for (var i = 0; i < edge.from.edges.length; i++) {
            var passingEdge = edge.from.edges[i];
            if (!passingEdge.passed) {
                newEdge = passingEdge;
            }
        }
        if (!newEdge) {
            for (var i = 0; i < edge.to.edges.length; i++) {
                var passingEdge = edge.to.edges[i];
                if (!passingEdge.passed) {
                    newEdge = passingEdge;
                }
            }
        }
        if (!newEdge) {
            return passedEdges;
        } else {
            newEdge.passed = true;
            return this.buildPathFromEdge(newEdge, maxSteps - 1, passedEdges.concat([newEdge]));
        }
    }

    getClosestConnectedRoute(route) {
        for (var i = 0; i < route.edges.length; i++) {
            var edge = route.edges[i];
            for (var j = 0; j < edge.from.edges.length; j++) {
                var subEdge = edge.from.edges[j];
                if (subEdge.route !== route) {
                    return subEdge.route;
                }
            }
            for (var j = 0; j < edge.to.edges.length; j++) {
                var subEdge = edge.to.edges[j];
                if (subEdge.route !== route) {
                    return subEdge.route;
                }
            }
        }
        //throw new Error('Could not find a closest connected route. Something must have gone wrong in a previous step because the graph must be fully connected.');
    }

    getOtherEndOfEdge(edge, stop) {
        return edge.to === stop ? edge.from : edge.to;
    }

    getEdgeInDirectionOf(edges, from, to, passedStops) {
        var closestEdge = null;
        var closestDistance = Number.MAX_SAFE_INTEGER;
        for (var i = 0; i < edges.length; i++) {
            var edge = edges[i];
            var edgeTo = this.getOtherEndOfEdge(edge, from);
            if (passedStops.indexOf(edgeTo) < 0) {
                var distance = DistanceHelpers.point2D(edgeTo, to);
                if (distance < closestDistance) {
                    closestEdge = edge;
                    closestDistance = distance;
                }
            }
        }
        return closestEdge;
    }
}

module.exports = ParameterizedRoutesGenerator;