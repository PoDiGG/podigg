'use strict';

const Config = require('../util/Config.js');
const Time = require('../util/Time.js');
const Util = require('../util/Util.js');
const ConnectionsGenerator = require('./ConnectionsGenerator.js');
const DistanceHelpers = require('../util/DistanceHelpers');

class ParameterizedConnectionsGenerator extends ConnectionsGenerator {
    constructor(region, routes, pointToLatLon, config) {
        super(region, routes, config);

        this._pointToLatLon = pointToLatLon;

        var param_scope = "connections:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        //this.param_time_initial = 1412158210000; // The initial timestamp
        //this.param_time_final = 1417428610000; // The final timestamp
        this.param_time_initial = Config.value(config, param_scope + 'time_initial', 0); // The initial timestamp
        this.param_time_final = Config.value(config, param_scope + 'time_final', 24 * 3600000 * 31); // The final timestamp
        this.param_connections = Config.value(config, param_scope + 'connections', 30000); // The number of connections to generate
        this.param_stop_wait_min = Config.value(config, param_scope + 'stop_wait_min', 60000); // The minimum waiting time per stop in milliseconds
        this.param_stop_wait_size_factor = Config.value(config, param_scope + 'stop_wait_size_factor', 60000); // The factor in milliseconds of stop waiting time to add depending on the station size

        this.param_route_choice_power = Config.value(config, param_scope + 'route_choice_power', 2); // Higher values means higher chance on larger routes when selecting routes
        this.param_vehicle_max_speed = Config.value(config, param_scope + 'vehicle_max_speed', 160); // km/h
        this.param_vehicle_speedup = Config.value(config, param_scope + 'vehicle_speedup', 5000); // km/(h^2)
        this.hours_until_max_speed = this.param_vehicle_max_speed / this.param_vehicle_speedup;
        this.distance_until_max_speed = Math.pow(this.hours_until_max_speed, 2) * this.param_vehicle_speedup;
        this.param_hourly_weekday_distribution = Config.value(config, param_scope + 'hourly_weekday_distribution', Time.DEFAULT_HOURLY_WEEKDAY_DISTRIBUTION);
        this.param_hourly_weekend_distribution = Config.value(config, param_scope + 'hourly_weekend_distribution', Time.DEFAULT_HOURLY_WEEKEND_DISTRIBUTION);
        this.pool_week_hours = Time.createTimeChoicePool(this.param_hourly_weekday_distribution);
        this.pool_weekend_hours = Time.createTimeChoicePool(this.param_hourly_weekend_distribution);

        this.param_delay_chance = Config.value(config, param_scope + 'delay_chance', 0); // The 0-1 chance that a connection will have a delay, 0 will not produce any delays (default)
        this.param_delay_max = Config.value(config, param_scope + 'delay_max', 3600000); // The maximum delay in milliseconds
        this.param_delay_choice_power = Config.value(config, param_scope + 'delay_choice_power', 1); // Higher values means higher chance on larger delays
        this.param_delay_reasons = Config.value(config, param_scope + 'delay_reasons', Util.DEFAULT_DELAY_REASONS); // Default reasons for having delays with their respective chance
        this.param_delay_reduction_duration_fraction = Config.value(config, param_scope + 'delay_reduction_duration_fraction', 0.1); // The maximum fraction of connection duration that can be subtracted when there is a delay
        this.pool_delay_reasons = Util.createChoicePool(this.param_delay_reasons, 10);
        if (this.param_delay_chance > 0) this.region.delays = true;
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    getRandomClosure() {
        return () => this.random();
    }

    getRandomInitialTime() {
        return Time.getRandomInitialTime(this.getRandomClosure(), this.pool_week_hours, this.pool_weekend_hours, this.param_time_initial, this.param_time_final);
    }

    getDistanceDuration(distance_km) {
        var halfway = distance_km / 2;
        if (this.distance_until_max_speed < halfway) {
            // We are able to reach max speed before having to slow down
            var constant_max_speed_duration = (distance_km - 2 * this.distance_until_max_speed) / this.param_vehicle_max_speed;
            return this.hours_until_max_speed * 2 + constant_max_speed_duration;
        } else {
            // We are not able to reach max speed before having to slow down again
            var duration_until_halfway = Math.sqrt(halfway / this.param_vehicle_speedup);
            return duration_until_halfway * 2;
        }
    }

    getTripDuration(trip) {
        return this.getDistanceDuration(DistanceHelpers.point2DHaversine(trip.from, trip.to, this._pointToLatLon)) * 3600000;
    }

    generate() {
        var routes = this.routes.sort((a, b) => b.size - a.size);
        while (this.connections.length < this.param_connections) {
            // Select random route, weighed by size
            var route = Util.getRandomElementWeightedBySize(this.getRandomClosure(), routes, this.param_route_choice_power);

            // Select random initial time, weighed by time distribution
            var initial = this.getRandomInitialTime();

            // For each trip
            var toAddConnections = [];
            var delayArrival = 0;
            var delayArrivalReason = null;
            route.trips.forEach(trip => {
                // Calculate trip duration (/\ speed distr, for longer trips, trains can go faster, until a max speed is reached)
                var duration = this.getTripDuration(trip);
                var delayDeparture = delayArrival;
                var delayDepartureReason = delayArrivalReason;

                // Each connection has a chance to experience delay, or gain additional delay for this trip.
                var wasDelay = !!delayArrival;
                delayArrival += this.random() < this.param_delay_chance ? Util.getRandomWeightedBySize(this.getRandomClosure(), this.param_delay_max, this.param_delay_choice_power) : 0;
                // All delays must have a reason.
                if (delayArrival && !delayArrivalReason) {
                    delayArrivalReason = this.pool_delay_reasons[Math.floor(this.random() * this.pool_delay_reasons.length)];
                }

                // Reduce the delay with a fraction of the duration of this connection
                if (delayArrival && wasDelay) {
                    delayArrival -= Math.floor(duration * this.param_delay_reduction_duration_fraction);
                    delayArrival = Math.max(0, delayArrival);
                }
                if (delayArrival == 0) {
                    delayArrivalReason = null;
                }

                // Also add a waiting time depending on the target station size
                var wait_time = this.param_stop_wait_min + trip.to.size * this.param_stop_wait_size_factor;

                // Set end time as new initial time
                toAddConnections.push({ departureTime: Math.floor(initial), arrivalTime: Math.floor(initial + duration),
                    trip: trip, delayDeparture: delayDeparture, delayArrival: delayArrival,
                    delayDepartureReason: delayDepartureReason, delayArrivalReason: delayArrivalReason });
                initial = initial + duration + wait_time;
            });

            // If end time > param_final, stop generating for this route
            if (initial > this.param_time_final) {
                continue;
            }

            // Add connections for added trip
            toAddConnections.forEach(connection => this.addConnection(connection.trip, connection.arrivalTime,
              connection.departureTime, connection.delayDeparture, connection.delayDepartureReason,
              connection.delayDepartureReason, connection.delayArrivalReason, connection.delayArrivalReason));
        }
        return this;
    }
}

module.exports = ParameterizedConnectionsGenerator;