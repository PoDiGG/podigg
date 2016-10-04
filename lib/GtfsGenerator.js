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
        this._regionGenerator = {
            'file': (cb) => {
                var path = this._options['region:region_file_path'];
                if (!path) throw new Error('Missing option parameter \'region:region_file_path\'');
                return new RegionFactory(path).createRegion(cb)
            },
            'noisy': (cb) => cb(new NoisyRegionGenerator().generate().getRegion()),
            'isolated': (cb) => cb(new IsolatedRegionGenerator().generate().getRegion()),
        };
    }

    generate(path) {
        this._regionGenerator[this._options['region:region_generator'] || 'noisy']((region) => {
            var pointToLatLon = DistanceHelpers.newPointToLatLonConverter(this._options['region:lat_offset'] || 0, this._options['region:lon_offset'] || 0, this._options['region:cells_per_latlon'] || 100);

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