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

const QuerySetGenerator = require('./query/QuerySetGenerator');

const GtfsBuilder = require('./gtfs/GtfsBuilder');

const fs = require('fs');
const winston = require('winston');

/* A GtfsGenerator generates GTFS files. */
class GtfsGenerator {
    constructor(options) {
        this._options = options || {};
        this._regionGenerator = {
            'file': (cb) => {
                var path = this._options['region:region_file_path'];
                if (!path) throw new Error('Missing option parameter \'region:region_file_path\'');
                if (!fs.existsSync(path)) path = __dirname + "/../data/" + path;
                return new RegionFactory(path).createRegion(cb)
            },
            'noisy': (cb) => cb(new NoisyRegionGenerator(this._options).generate().getRegion()),
            'isolated': (cb) => cb(new IsolatedRegionGenerator(this._options).generate().getRegion()),
        };
    }

    generate(path) {
      winston.log('info', 'Generating with options: ', this._options);
      this._regionGenerator[this._options['region:region_generator'] || 'noisy']((region) => {
        var pointToLatLon = DistanceHelpers.newPointToLatLonConverter(this._options['region:lat_offset'] || 0, this._options['region:lon_offset'] || 0, this._options['region:cells_per_latlon'] || 100);

        winston.log('info', '>> Generating stops');
        var generator_stops = new ParameterizedStopsGenerator(region, this._options).generate();
        winston.log('info', '>> Generating edges');
        var edges = new ParameterizedEdgesGenerator(region, this._options).generate().getEdges();
        winston.log('info', '>> Generating stops post-edges');
        generator_stops.generatePostEdges(edges);
        winston.log('info', '>> Generating routes');
        var routes = new ParameterizedRoutesGenerator(region, edges, this._options).generate().getRoutes();
        winston.log('info', '>> Generating connections');
        var connections = new ParameterizedConnectionsGenerator(region, routes, pointToLatLon, this._options).generate().getConnections();

        winston.log('info', '>> Visualizing output');
        new TripsVisualizer(region, edges, routes, connections, false, 2, true).render(path + '/generated.png');
        winston.log('info', '>> Exporting to GTFS');
        new GtfsBuilder(region, routes, connections, pointToLatLon, this._options).generate(path + '/gtfs/');

        if (this._options['queryset:generate']) {
          winston.log('info', '>> Generating queryset');
          new QuerySetGenerator(region, this._options).generate(path + '/queryset.jsonstream');
        }
      });
    }

    get options() {
      return this._options;
    }

    static fromEnvironmentVariables() {
      var jsonify_values = [
        'connections:hourly_weekday_distribution',
        'connections:hourly_weekend_distribution',
        'connections:delay_reasons',
        'queryset:hourly_weekday_distribution',
        'queryset:hourly_weekend_distribution'
      ];

      var config = {};
      for (var env in process.env) {
        var prefixPos = env.indexOf('GTFS_GEN_');
        if (prefixPos == 0) {
          var name = env.slice('GTFS_GEN_'.length, env.length);
          var split = name.split('__');
          var configKey = split.length == 2 ? split[0].toLowerCase() + ":" + split[1].toLowerCase() : name.toLowerCase();
          var value = process.env[env];
          if (jsonify_values.indexOf(configKey) >= 0) {
            value = JSON.parse(value);
          }
          config[configKey] = value;
        }
      }
      return new GtfsGenerator(config);
    }
}

GtfsGenerator.Evaluator = require('./evaluate/Evaluator');

module.exports = GtfsGenerator;