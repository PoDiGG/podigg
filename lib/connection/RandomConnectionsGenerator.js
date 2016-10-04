'use strict';

const Config = require('../util/Config.js');
const ConnectionsGenerator = require('./ConnectionsGenerator.js');

class RandomConnectionsGenerator extends ConnectionsGenerator {
    constructor(region, routes, config) {
        super(region, routes, config);

        var param_scope = "connections:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_time_initial = Config.value(config, param_scope + 'time_initial', 0); // The initial timestamp
        this.param_time_final = Config.value(config, param_scope + 'time_final', 24 * 3600000); // The final timestamp
        this.param_connections = Config.value(config, param_scope + 'connections', 30000); // The number of connections to generate
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate() {
        var timeRange = this.param_time_final - this.param_time_initial;
        while (this.connections.length < this.param_connections) {
            var route = this.routes[Math.floor(this.random() * this.routes.length)];
            var departureTimeRoute = this.param_time_initial + Math.floor(this.random() * timeRange);
            var arrivalTimeRoute = departureTimeRoute + Math.floor(this.random() * (this.param_time_final - departureTimeRoute));
            var timeRangeRoute = arrivalTimeRoute - departureTimeRoute;
            route.trips.forEach((trip, i) => {
                this.addConnection(trip, departureTimeRoute + i * timeRangeRoute, departureTimeRoute + (i + 1) * timeRangeRoute);
            });
        }
        return this;
    }
}

module.exports = RandomConnectionsGenerator;