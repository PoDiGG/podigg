'use strict';

const NoisyRegionGenerator = require('./region/NoisyRegionGenerator');
const IsolatedRegionGenerator = require('./region/IsolatedRegionGenerator');
const RegionFactory = require('./region/RegionFactory');
const TripsVisualizer = require('./visualize/TripsVisualizer');
const DistanceHelpers = require('./util/DistanceHelpers');

const ParameterizedStopsGenerator = require('./stop/ParameterizedStopsGenerator');
const RandomStopsGenerator = require('./stop/RandomStopsGenerator');

const ParameterizedEdgesGenerator = require('./edge/ParameterizedEdgesGenerator');
const RandomEdgesGenerator = require('./edge/RandomEdgesGenerator');

const RandomRoutesGenerator = require('./route/RandomRoutesGenerator');
const ParameterizedRoutesGenerator = require('./route/ParameterizedRoutesGenerator');

const RandomConnectionsGenerator = require('./connection/RandomConnectionsGenerator');
const ParameterizedConnectionsGenerator = require('./connection/ParameterizedConnectionsGenerator');
const GtfsBuilder = require('./gtfs/GtfsBuilder');

/* A GtfsGenerator generates GTFS files. */
class GtfsGenerator {
    constructor(options) {
        this._options = options || {};
    }

    generate(path) {
        //var region = new NoisyRegionGenerator().generate().getRegion();
        //var region = new IsolatedRegionGenerator().generate().getRegion();
        new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
            var pointToLatLon = DistanceHelpers.newPointToLatLonConverter(this._options.lat_offset || 0, this._options.lon_offset || 0, this._options.latlon_per_cell || 100);

            var generator_stops = new ParameterizedStopsGenerator(region, this._options).generate();
            var edges = new ParameterizedEdgesGenerator(region, this._options).generate().getEdges();
            generator_stops.generatePostEdges(edges);
            var routes = new ParameterizedRoutesGenerator(region, edges, this._options).generate().getRoutes();
            var connections = new ParameterizedConnectionsGenerator(region, routes, pointToLatLon, this._options).generate().getConnections();

            new TripsVisualizer(region, edges, routes, connections, false, 2, true).render(path + '/generated.png');
            new GtfsBuilder(region, routes, connections, pointToLatLon, this._options).generate(path + '/gtfs/');
        });
    }
}

module.exports = GtfsGenerator;