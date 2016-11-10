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

        this.param_route_choice_power = Config.value(config, param_scope + 'route_choice_power', 2); // Higher values means higher chance on larger routes when selecting routes
        this.param_vehicle_max_speed = Config.value(config, param_scope + 'vehicle_max_speed', 160); // km/h
        this.param_vehicle_speedup = Config.value(config, param_scope + 'vehicle_speedup', 5000); // km/(h^2)
        this.hours_until_max_speed = this.param_vehicle_max_speed / this.param_vehicle_speedup;
        this.distance_until_max_speed = Math.pow(this.hours_until_max_speed, 2) * this.param_vehicle_speedup;
        this.param_hourly_weekday_distribution = Config.value(config, param_scope + 'hourly_weekday_distribution', Time.DEFAULT_HOURLY_WEEKDAY_DISTRIBUTION);
        this.param_hourly_weekend_distribution = Config.value(config, param_scope + 'hourly_weekend_distribution', Time.DEFAULT_HOURLY_WEEKEND_DISTRIBUTION);
        this.pool_week_hours = Time.createTimeChoicePool(this.param_hourly_weekday_distribution);
        this.pool_weekend_hours = Time.createTimeChoicePool(this.param_hourly_weekend_distribution);
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
            route.trips.forEach(trip => {
                // Calculate trip duration (/\ speed distr, for longer trips, trains can go faster, until a max speed is reached)
                var duration = this.getTripDuration(trip);

                // Set end time as new initial time
                toAddConnections.push({ departureTime: Math.floor(initial), arrivalTime: Math.floor(initial + duration), trip: trip });
                initial = initial + duration;
            });

            // If end time > param_final, stop generating for this route
            if (initial > this.param_time_final) {
                continue;
            }

            // Add connections for added trip
            toAddConnections.forEach(connection => this.addConnection(connection.trip, connection.arrivalTime, connection.departureTime));
        }
        return this;
    }
}

module.exports = ParameterizedConnectionsGenerator;