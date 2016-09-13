'use strict';

/* A ConnectionsGenerator generates (time-instantiated) connections of routes/trips given a stop-populated region and a list of routes. */
class ConnectionsGenerator {
    constructor(region, routes) {
        this.region = region;
        this.routes = routes; // [ ... { routeId, [ ... trip ... ] } ... ]
        this.connections = [];
    }

    addConnection(tripId, departureTime, arrivalTime){
        this.connections.push({ tripId: tripId, departureTime: departureTime, arrivalTime: arrivalTime });
    }

    generate() {
        throw new Error('ConnectionsGenerator#generate() has not been implemented yet.');
    }

    getConnections() {
        return this.connections;
    }
}

module.exports = ConnectionsGenerator;