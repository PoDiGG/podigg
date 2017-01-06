'use strict';

const fs = require('fs');
const Region = require('../region/Region');
const Util = require('../util/Util');
const csvWriter = require('csv-write-stream');
const name_generator = require('random-name');

/* A GtfsBuilder exports connections to GTFS (agency.txt, routes.txt, trips.txt, stops.txt, stop_times.txt, calendar_dates.txt, calendar.txt). */
class GtfsBuilder {
    constructor(region, routes, connections, pointToLatLon, options) {
        options = options || {};
        this.region = region;
        this.routes = routes;
        this.connections = connections;
        this._pointToLatLon = pointToLatLon;
        this.param_seed = options.seed || 1; // Random seed
        this.param_seed_start = this.param_seed;
        this._agency_name = options.agency_name || "[Generated]";
        this._agency_url = options.agency_url || "http://example.org";
        this._agency_timezone = options.agency_timezone || "Europe/Brussels";
        this._route_type = options.route_type || 2; // 2: rail
        this._generatedPlaces = {};
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    generate(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        this._generateAgency(path + 'agency.txt');
        this._generateRoutes(path + 'routes.txt');
        this._generateTrips(path + 'trips.txt');
        this._generateStops(path + 'stops.txt');
        var delivered_dates = this._generateStopTimes(path + 'stop_times.txt');
        this._generateCalendarDates(path + 'calendar_dates.txt', delivered_dates);
        this._generateCalendar(path + 'calendar.txt');
        if (this.region.delays) {
            this._generateDelays(path + 'delays.txt');
        }
    }

    _writeCsvData(path, cb) {
        var writer = csvWriter();
        writer.pipe(fs.createWriteStream(path));
        cb(writer);
        writer.end();
    }

    _generateAgency(path) {
        this._writeCsvData(path, writer => {
            writer.write({
                agency_id: 0,
                agency_name: this._agency_name,
                agency_url: this._agency_url,
                agency_timezone: this._agency_timezone
            });
        });
    }

    _generateRoutes(path) {
        this._writeCsvData(path, writer => {
            this.routes.forEach(route => {
                writer.write({
                    route_id: this.param_seed_start + "_" + route.routeId,
                    agency_id: 0,
                    route_short_name: "route_" + route.routeId,
                    route_long_name: "",
                    route_type: this._route_type
                });
            });
        });
    }

    _generateTrips(path) {
        var emittedConnectionSequences = {};
        this._writeCsvData(path, writer => {
            this.connections.forEach(connection => {
                if (!emittedConnectionSequences[connection.connectionSequenceId]) {
                    emittedConnectionSequences[connection.connectionSequenceId] = true;
                    var routeId = connection.trip.route.routeId;
                    writer.write({
                        route_id: this.param_seed_start + "_" + routeId,
                        service_id: routeId,
                        trip_id: this.param_seed_start + "_" + connection.connectionSequenceId
                    });
                }
            });
        });
    }

    _generateStops(path) {
        this._writeCsvData(path, writer => {
            this.region.getStations().forEach((station, i) => {
                var [ lat, lon ] = this._pointToLatLon(station);
                var randOld = Math.random;
                Math.random = () => this.random();
                writer.write({
                    stop_id: this.param_seed_start + "_" + Util.stopToNamedId(station),
                    stop_name: this._generatePlaceName(),
                    stop_lat: lat,
                    stop_lon: lon,
                });
                Math.random = randOld;
            });
        });
    }

    _generatePlaceName() {
        var placeName = name_generator.place();
        while (this._generatedPlaces[placeName]) {
            placeName += "-" + name_generator.place();
        }
        this._generatedPlaces[placeName] = true;
        return placeName;
    }

    _dateToHhMmSs(date, referenceDate) {
        var hours = date.getHours();
        var currentDay = Math.floor(date.getTime() / (3600000 * 24));
        var referenceDay = Math.floor(referenceDate / (3600000 * 24));
        if (currentDay !== referenceDay) {
            hours += 24 * (currentDay - referenceDay);
        }
        return this._prefixZero(hours) + ":" + this._prefixZero(date.getMinutes()) + ":" + this._prefixZero(date.getSeconds());
    }

    _getDay(date) {
        return date.getTime() - (date.getTime() % (3600000 * 24));
    }

    _prefixZero(element) {
        return element < 10 ? "0" + element : element;
    }

    _generateStopTimes(path) {
        var writtenTimes = {};
        var delivered_dates = {};
        this._writeCsvData(path, writer => {
            var lastConnection = null;
            var referenceDay = null;
            this.connections.forEach(connection => {
                var writeForStop = (stop, i) => {
                    var arrivalTime = new Date(lastConnection ? lastConnection.arrivalTime : connection.departureTime);
                    var departureTime = new Date(connection ? connection.departureTime : lastConnection.arrivalTime);
                    var route_id = (connection || lastConnection).trip.route.routeId;
                    var arrivalHour = this._dateToHhMmSs(arrivalTime, referenceDay);
                    var departureHour = this._dateToHhMmSs(departureTime, referenceDay);
                    var key = route_id + "-" + "-" + arrivalTime + "-" + departureTime + "-" + i;
                    if (!writtenTimes[key]) {
                        writer.write({
                            trip_id: this.param_seed_start + "_" + (connection || lastConnection).connectionSequenceId,
                            arrival_time: arrivalHour,
                            departure_time: departureHour,
                            stop_id: this.param_seed_start + "_" + Util.stopToNamedId(stop),
                            stop_sequence: i,
                        });
                        writtenTimes[key] = true;
                        delivered_dates[route_id] = {};
                    }
                    delivered_dates[route_id][arrivalTime.getFullYear() + "" + this._prefixZero(arrivalTime.getMonth() + 1) + "" + this._prefixZero(arrivalTime.getDate())] = true;
                };

                var stop_sequence = connection.trip.route.trips.indexOf(connection.trip);
                if (stop_sequence === 0) referenceDay = this._getDay(new Date(connection.departureTime));
                writeForStop(connection.trip.from, stop_sequence);
                if (connection.trip.route.trips.length == stop_sequence + 1) {
                    lastConnection = connection;
                    connection = null;
                    writeForStop((connection || lastConnection).trip.to, (connection || lastConnection).trip.route.trips.length);
                }
                lastConnection = connection;
            });
        });
        return delivered_dates;
    }

    _generateCalendarDates(path, delivered_dates) {
        this._writeCsvData(path, writer => {
            Object.keys(delivered_dates).forEach(route_id => {
                var route_dates = delivered_dates[route_id];
                Object.keys(route_dates).forEach(date => {
                    writer.write({
                        service_id: route_id,
                        date: date,
                        exception_type: 1
                    });
                });
            });
        });
    }

    _generateCalendar(path) {
        var os = fs.createWriteStream(path)
        os.write("service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n")
        os.end();
    }

    _generateDelays(path) {
        this._writeCsvData(path, writer => {
            this.connections.forEach(connection => {
                var writeForStop = (stop, i, connection) => {
                    var route_id = connection.trip.route.routeId;
                    if (connection.delayDeparture || connection.delayArrival) {
                        writer.write({
                            trip_id: this.param_seed_start + "_" + connection.connectionSequenceId,
                            stop_sequence: i,
                            delay_departure: connection.delayDeparture,
                            delay_arrival: connection.delayArrival,
                            delay_departure_reason: connection.delayDepartureReason,
                            delay_arrival_reason: connection.delayArrivalReason
                        });
                    }
                };

                var stop_sequence = connection.trip.route.trips.indexOf(connection.trip);
                writeForStop(connection.trip.from, stop_sequence, connection);
            });
        });
    }
}

module.exports = GtfsBuilder;