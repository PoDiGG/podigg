'use strict';

const fs = require('fs');
const csvparse = require('csv-parse');
const transform = require('stream-transform');

const Region = require('./Region.js');
const Point = require('./../util/Point.js');
const TripsVisualizer = require('./../visualize/TripsVisualizer.js');

class RegionFactory {
    constructor(region_cells_filepath, region_edges_filepath, mark_stops, mark_edges) {
        this.region_cells_filepath = region_cells_filepath;
        this.region_edges_filepath = region_edges_filepath;
        this.mark_stops = mark_stops;
        this.mark_edges = mark_edges;
    }

    createRegion(cb) {
        this.prepareData(new Region())
          .then(({ region, edges, routes, connections }) => {
              cb(region, edges, routes, connections);
          })
          .catch(function(error) {
              console.error(error.stack);
          });
    }

    consumeFile(filename, consumer, delimiter) {
        return new Promise((resolve, reject) => {
            var parser = csvparse({delimiter: delimiter || ','});
            var input = fs.createReadStream(filename);
            var first = true;
            var transformer = transform((record, callback) => {
                if (first) {
                    first = false;
                } else {
                    consumer(record);
                }
                callback(null);
            }, reject);

            input.pipe(parser).pipe(transformer).on('finish', resolve);
        });
    }

    prepareData(region) {
        var prepareResult = this.consumeFile(this.region_cells_filepath, (record) => {
            var point = new Point(parseInt(record[0]), parseInt(record[1]), parseFloat(record[4]));
            if (point.value > 0) point.value = Math.log(point.value + 1);
            region.put(point);
            if (this.mark_stops && record[5] == "1") {
                region.markStation(point.x, point.y);
            }
        }).then(() => {
            return { region: region };
        });
        if (this.mark_edges) {
            prepareResult = prepareResult
              .then(({ region: region }) => this.loadEdges(region));
        }
        return prepareResult;
    }

    parseHhMmSs(input) {
        var split = input.split(':');
        return ((+split[0]) * 60 * 60 + (+split[1]) * 60 + (+split[2])) * 1000;
    }

    loadEdges(region) {
        var edgesCache = {};
        var edges = [];
        var routes = [];
        var connections = [];
        var routeIds = {};
        return this.consumeFile(this.region_edges_filepath, (record) => {
            var from = region.getRaw(parseInt(record[0]), parseInt(record[1]));
            var to = region.getRaw(parseInt(record[2]), parseInt(record[3]));
            var tripId = record[4];
            var arrivalTime = this.parseHhMmSs(record[5]);
            var departureTime = this.parseHhMmSs(record[6]);
            if (from && to) {
                var edgesCacheKey = record[0] + "-" + record[1] + "-" + record[2] + "-" + record[3];
                var edge = edgesCache[edgesCacheKey];
                if (!edge) {
                    edge = {tripId: tripId, edgeId: edges.length, from: from, to: to};
                    edges.push(edge);
                    edgesCache[edgesCacheKey] = edge;
                    var routeId = routeIds[tripId];
                    if (!routeId && routeId !== 0) {
                        routeId = routes.length;
                        routeIds[tripId] = routeId;
                        routes[routeId] = {routeId: routeId, edges: [], trips: [], size: 0};
                    }
                    edge.route = routes[routeId];
                    region.markEdge(from.x, from.y, edge);
                    region.markEdge(to.x, to.y, edge);
                    routes[routeId].edges.push(edge);
                    routes[routeId].trips.push(edge);
                    routes[routeId].size += edge.from.size + edge.to.size;
                }
                connections.push({ tripId: tripId, arrivalTime: arrivalTime, departureTime: departureTime, trip: edge });

            }
        }).then(() => { return { region: region, edges: edges, routes: routes, connections: connections } });
    }
}

module.exports = RegionFactory;