'use strict';

const Config = require('../util/Config.js');
const ConnectionsGenerator = require('./ConnectionsGenerator.js');
const Util = require('../util/Util.js');

class RandomConnectionsGenerator extends ConnectionsGenerator {
    constructor(region, routes, config) {
        super(region, routes, config);

        var param_scope = "connections:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_time_initial = Config.value(config, param_scope + 'time_initial', 0); // The initial timestamp
        this.param_time_final = Config.value(config, param_scope + 'time_final', 31 * 24 * 3600000); // The final timestamp
        this.param_connections = Config.value(config, param_scope + 'connections', 30000); // The number of connections to generate
        this.param_delay_max = Config.value(config, param_scope + 'delay_max', 3600000); // The maximum delay in milliseconds
        this.param_delay_reasons = Config.value(config, param_scope + 'delay_choice_power', Util.DEFAULT_DELAY_REASONS); // Default reasons for having delays with their respective chance
        this.pool_delay_reasons = Util.createChoicePool(this.param_delay_reasons, 10);
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
            var timeRangeRoute = (arrivalTimeRoute - departureTimeRoute) / route.trips.length;
            timeRangeRoute = 120000;
            route.trips.forEach((trip, i) => {
                this.addConnection(trip, departureTimeRoute + i * timeRangeRoute, departureTimeRoute + (i + 1) * timeRangeRoute,
                  Math.floor(this.random() * this.param_delay_max), Math.floor(this.random() * this.param_delay_max),
                  this.pool_delay_reasons[Math.floor(this.random() * this.pool_delay_reasons.length)], this.pool_delay_reasons[Math.floor(this.random() * this.pool_delay_reasons.length)]);
            });
        }
        return this;
    }
}

module.exports = RandomConnectionsGenerator;