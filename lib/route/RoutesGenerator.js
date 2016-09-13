'use strict';

/* A RoutesGenerator generates a list of routes. */
class RoutesGenerator {
    constructor(region, trips) {
        this.region = region;
        this.trips = trips; // [ ... { from, to } ... ]; tripId's are their index in this array
        this.routes = []; // [ ... { routeId, [ ... trip ... ] } ... ]
    }

    addRoute(trips){
        var routeId = this.routes.length;
        this.routes.push({ routeId: routeId, trips: trips });
    }

    generate() {
        throw new Error('RoutesGenerator#generate() has not been implemented yet.');
    }

    getRoutes() {
        return this.routes;
    }
}

module.exports = RoutesGenerator;