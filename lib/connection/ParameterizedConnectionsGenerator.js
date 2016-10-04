'use strict';

const Config = require('../util/Config.js');
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
        this.param_time_final = Config.value(config, param_scope + 'time_final', 24 * 3600000); // The final timestamp
        this.param_connections = Config.value(config, param_scope + 'connections', 30000); // The number of connections to generate

        this.param_route_choice_power = Config.value(config, param_scope + 'route_choice_power', 2); // Higher values means higher chance on larger routes when selecting routes
        this.param_time_choice_power = Config.value(config, param_scope + 'time_choice_power', 3); // Higher values means higher chance on more frequent times when selecting times
        this.param_vehicle_max_speed = Config.value(config, param_scope + 'vehicle_max_speed', 160); // km/h
        this.param_vehicle_speedup = Config.value(config, param_scope + 'vehicle_speedup', 5000); // km/(h^2)
        this.hours_until_max_speed = this.param_vehicle_max_speed / this.param_vehicle_speedup;
        this.distance_until_max_speed = Math.pow(this.hours_until_max_speed, 2) * this.param_vehicle_speedup;
        this.param_hourly_weekday_distribution = Config.value(config, param_scope + 'hourly_weekday_distribution', [
            0.05,
            0.01,
            0.01,
            0.48,
            2.46,
            5.64,
            7.13,
            6.23,
            5.44,
            5.43,
            5.41,
            5.49,
            5.42,
            5.41,
            5.57,
            6.70,
            6.96,
            6.21,
            5.40,
            4.95,
            4.33,
            3.31,
            1.56,
            0.42
        ]);
        this.param_hourly_weekend_distribution = Config.value(config, param_scope + 'hourly_weekend_distribution', [
            0.09,
            0.01,
            0.01,
            0.08,
            0.98,
            3.56,
            5.23,
            5.79,
            5.82,
            5.89,
            5.84,
            5.91,
            5.88,
            5.95,
            5.87,
            5.95,
            5.89,
            5.96,
            5.92,
            5.94,
            5.62,
            4.61,
            2.45,
            0.76
        ]);

        var sortHours = (distr) => {
            return distr
              .map((val, i) => {
                  return { hour: i, val: val };
              })
              .sort((a, b) => b.val - a.val)
              .map((val, i) => {
                  return val.hour;
              });
        };
        this.sorted_week_hours = sortHours(this.param_hourly_weekday_distribution);
        this.sorted_weekend_hours = sortHours(this.param_hourly_weekend_distribution);
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    getRandomElementWeightedBySize(elements, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = this.random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        var randi = Math.floor(beta_left * elements.length);
        return elements[randi];
    }

    getRandomInitialTime() {
        // Get random day
        var timeRange = this.param_time_final - this.param_time_initial;
        var time = this.param_time_initial + Math.floor(this.random() * timeRange);
        var timeDay = time - (time % (3600000 * 24));

        // Select weekday or weekend distr
        var day = new Date(time).getDay();
        var isWeekend = (day == 6) || (day == 0);
        var distr = isWeekend ? this.sorted_weekend_hours : this.sorted_week_hours;

        // Get random hour of day
        var hour = this.getRandomElementWeightedBySize(distr, this.param_time_choice_power) * 3600000;

        // Return day + hour + random offset in the hour
        return timeDay + hour + Math.floor(this.random() * 3600000);
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
            var route = this.getRandomElementWeightedBySize(routes, this.param_route_choice_power);

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