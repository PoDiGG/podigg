'use strict';

const fs = require('fs');
const csvparse = require('csv-parse');
const transform = require('stream-transform');

const Point = require('../lib/Point.js');
const Region = require('../lib/Region.js');

var points = [];
var region = new Region();
var trips = [];

var maxx = 0;
var maxy = 0;
var maxdistance = 0;
var maxvalue = 0;

var param_seed = 1; // Random seed
var param_min_station_size = 0.01; // The minimum population density for a station to form
var param_trips = 100; // The number of trips to generate
var param_start_stop_choice_power = 4; // Higher values means higher chance on larger stations when selecting starting stations
var param_target_stop_in_radius_choice_power = 3; // Higher values means higher chance on larger stations when selecting target stations in a radius
var param_max_trip_distance_factor = 0.5; // The maximum distance of a trip divided by the maximum region diameter
var param_max_size_difference_factor = 0.5; // The maximum relative distance end stations can have

function random() {
    var x = Math.sin(param_seed++) * 10000;
    return x - Math.floor(x);
}

prepareData();
function prepareData() {
    var parser = csvparse({delimiter: ','});
    var input = fs.createReadStream('input_data/region_cells.csv');
    var transformer = transform((record, callback) => {
        if (record[0] != 'x') {
            var point = new Point(parseInt(record[0]), parseInt(record[1]), parseFloat(record[4]));
            if (point.value > 0) point.value = Math.log(point.value + 1);
            region.put(point.x, point.y, point.value); // TODO: currently, size == popdensity
            if (point.value >= param_min_station_size) {
                points.push(point);
                maxx = Math.max(maxx, point.x);
                maxy = Math.max(maxy, point.y);
                maxvalue = Math.max(maxvalue, point.value);
            }
        }
        callback(null);
    }, () => {});

    input.pipe(parser).pipe(transformer).on('finish', function() {
        setImmediate(() => {
            points.sort(function(a, b) {
                return b.value - a.value;
            });
            maxdistance = Math.max(maxx, maxy);
            generateStopsAndTrips();
        });
    });
}

function getRandomElementWeightedBySize(elements, power) {
    // Choose a random value with a larger chance of having a lower index.
    var uniform = random();
    var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
    var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
    var randi = Math.floor(beta_left * elements.length);
    return elements[randi];
}

function getRandomPointWeightedBySize() {
    return getRandomElementWeightedBySize(points, param_start_stop_choice_power);
}

function generateStopsAndTrips() {
    // Pick X times a random station
    // Based, on the size, define a radius
    // Within that radius, find X stations
    // Pick random station in that list, weighted by difference in size (exclude stations with a smaller size)
    // Create a trip between those stations
    for (var i = 0; i < param_trips; i++) {
        var point = getRandomPointWeightedBySize();
        while (point.value < param_min_station_size) {
            point = getRandomPointWeightedBySize();
        }
        var radius = point.value / maxvalue * maxdistance * param_max_trip_distance_factor;
        var points = region.getPointsInRegion(point.x, point.y, Math.ceil(radius), point.value * param_max_size_difference_factor);
        points.sort(function(a, b) {
            return point.value - Math.abs(a.value - b.value);
        });
        var targetPoint = getRandomElementWeightedBySize(points, param_target_stop_in_radius_choice_power);

        if (targetPoint) {
            trips.push({from: point, to: targetPoint});
        }
    }

    console.log(trips); // TODO
    // TODO: modify all trips and try to go over stations
}
