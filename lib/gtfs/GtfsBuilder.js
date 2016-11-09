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
        this._agency_name = options.agency_name || "[Generated]";
        this._agency_url = options.agency_url || "http://example.org";
        this._agency_timezone = options.agency_timezone || "Europe/Brussels";
        this._route_type = options.route_type || 2; // 2: rail
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
                    route_id: route.routeId,
                    agency_id: 0,
                    route_short_name: "route_" + route.routeId,
                    route_long_name: "",
                    route_type: this._route_type
                });
            });
        });
    }

    _generateTrips(path) {
        this._writeCsvData(path, writer => {
            this.routes.forEach(route => {
                writer.write({
                    route_id: route.routeId,
                    service_id: route.routeId,
                    trip_id: route.routeId
                });
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
                    stop_id: Util.stopToNamedId(station),
                    stop_name: name_generator.place(),
                    stop_lat: lat,
                    stop_lon: lon,
                });
                Math.random = randOld;
            });
        });
    }

    _dateToHhMmSs(date) {
        return this._prefixZero(date.getHours()) + ":" + this._prefixZero(date.getMinutes()) + ":" + this._prefixZero(date.getSeconds());
    }

    _prefixZero(element) {
        return element < 10 ? "0" + element : element;
    }

    _generateStopTimes(path) {
        var writtenTimes = {};
        var delivered_dates = {};
        this._writeCsvData(path, writer => {
            this.connections.forEach(connection => {
                var arrivalTime = new Date(connection.arrivalTime);
                var departureTime = new Date(connection.departureTime);
                var writeForStop = (stop, i) => {
                    var route_id = connection.trip.route.routeId;
                    var arrivalHour = this._dateToHhMmSs(arrivalTime);
                    var departureHour = this._dateToHhMmSs(departureTime);
                    var key = route_id + "-" + "-" + arrivalHour + "-" + departureHour;
                    if (!writtenTimes[key]) {
                        writer.write({
                            trip_id: route_id,
                            arrival_time: arrivalHour,
                            departure_time: departureHour,
                            stop_id: Util.stopToNamedId(stop),
                            stop_sequence: i,
                        });
                        writtenTimes[key] = true;
                        delivered_dates[route_id] = [];
                    }
                    delivered_dates[route_id].push(arrivalTime.getFullYear() + "" + this._prefixZero(arrivalTime.getMonth() + 1) + "" + this._prefixZero(arrivalTime.getDate() + 1));
                };

                var stop_sequence = connection.trip.route.trips.indexOf(connection.trip);
                writeForStop(connection.trip.from, stop_sequence);
                if (connection.trip.route.trips.length == stop_sequence + 1) {
                    writeForStop(connection.trip.to, connection.trip.route.trips.length);
                }
            });
        });
        return delivered_dates;
    }

    _generateCalendarDates(path, delivered_dates) {
        this._writeCsvData(path, writer => {
            Object.keys(delivered_dates).forEach(route_id => {
                delivered_dates[route_id].forEach(date => {
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
}

module.exports = GtfsBuilder;