'use strict';

const RoutesGenerator = require('./RoutesGenerator.js');

class ParameterizedRoutesGenerator extends RoutesGenerator {
    constructor(region, edges) {
        super(region, edges);

        this.param_seed = 1; // Random seed
        this.param_routes = 100; // The number of routes to generate
        this.param_largest_stations_fraction = 0.25; // The fraction of (largest) stations inbetween which routes need to be formed.
        this.param_penalize_station_size_area = 10; // The area in which station sizes should be penalized.
        this.param_max_route_length = 10; // The maximum number of edges a route can have, the larger, the slower this generator.
        this.param_trips_per_route_average = 5; // The average number of trips per route.
        this.param_trips_per_route_deviation = 1; // The maximum devation in number of trips per route.
        this.param_trips_per_route_minimum = this.param_trips_per_route_average - this.param_trips_per_route_deviation;
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

        // Make routes from all stops in L to all stops in L
        for (var i = 0; i < stations.length; i++) {
            var station1 = stations[i];
            console.log(i + " / " + stations.length); // TODO
            for (var j = 0; j < i; j++) {
                // For stop A and B
                var station2 = stations[j];

                // Get shortest path P over edges
                var path = this.getShortestPath(station1.realPoint, station2.realPoint, null, null, this.param_max_route_length);
                if (path) {
                    path.forEach(edge => edge.passed = true);
                    this.addRoute(path);
                }
            }
        }

        // Build routes for each edge that has not been passed yet.
        for (var i = 0; i < this.edges.length; i++) {
            var edge = this.edges[i];
            if (!edge.passed) {
                var path = this.buildPathFromEdge(edge, this.param_max_route_length);
                this.addRoute(path);
            }
        }

        // Loop over all edges, and if if len < this.param_trips_per_route_minimum, merge with a connected edge
        for (var i = this.routes.length - 1; i >= 0 ; i--) {
            var route = this.routes[i];
            if (route.edges.length < this.param_trips_per_route_minimum) {
                var newRoute = this.getClosestConnectedRoute(route);
                this.routes.splice(i, 1);
                route.edges.forEach(edge => { edge.route = newRoute; newRoute.edges.push(edge); });
            }
        }

        // Based on the total number of edges in each route, derive appropriate number of trips (always around the same amount, param)
        // TODO
    }

    getShortestPath(point1, point2, passedPoints, passedEdges, maxSteps) {
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
            var newPassedStation = edge.to === point1 ? edge.from : edge.to;
            if (newPassedStation) {
                var path = this.getShortestPath(point2, newPassedStation, passedPoints.concat([point1]), passedEdges.concat([edge]), maxSteps ? (shortestPath ? Math.min(maxSteps - 1, shortestPath.length) : maxSteps - 1) : (shortestPath ? shortestPath.length : null));
                if (path && (!shortestPath || path.length < shortestPath.length)) {
                    shortestPath = path;
                }
            }
        }
        return shortestPath;
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
        throw new Error('Could not find a closest connected route. Something must have gone wrong in a previous step because the graph must be fully connected.');
    }
}

module.exports = ParameterizedRoutesGenerator;