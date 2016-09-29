'use strict';

/* A ConnectionsGenerator generates (time-instantiated) connections of routes/trips given a stop-populated region and a list of routes. */
class ConnectionsGenerator {
    constructor(region, routes) {
        this.region = region;
        this.routes = routes; // [ ... { routeId, [ ... trip ... ] } ... ]
        this.connections = [];
    }

    addConnection(trip, departureTime, arrivalTime){
        this.connections.push({ tripId: trip.tripId, departureTime: departureTime, arrivalTime: arrivalTime, trip: trip });
    }

    generate() {
        throw new Error('ConnectionsGenerator#generate() has not been implemented yet.');
    }

    getConnections() {
        return this.connections.sort((c1, c2) => c1.departureTime - c2.departureTime);
    }
}

module.exports = ConnectionsGenerator;