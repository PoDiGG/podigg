'use strict';

/* A RoutesGenerator generates a list of routes. */
class RoutesGenerator {
    constructor(region, edges) {
        this.region = region;
        this.edges = edges; // [ ... { from, to } ... ]; tripId's are their index in this array
        this.nextRouteId = 0;
        this.routes = []; // [ ... { routeId, [ ... edgeId ... ] } ... ]
        this.debugpoints = [];
    }

    addRoute(edges){
        this.addRouteRaw(edges, null);
    }

    addRouteRaw(edges, trips){
        var routeId = this.nextRouteId++;
        var size = 0;
        edges.forEach(edge => size = size + edge.from.size + edge.to.size);
        var route = { routeId: routeId, edges: edges, trips: trips, size: size };
        this.routes.push(route);
        edges.forEach(edge => edge.route = route);
    }

    generate() {
        throw new Error('RoutesGenerator#generate() has not been implemented yet.');
    }

    getRoutes() {
        return this.routes;
    }
}

module.exports = RoutesGenerator;