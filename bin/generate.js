'use strict';

const NoisyRegionGenerator = require('../lib/region/NoisyRegionGenerator');
const IsolatedRegionGenerator = require('../lib/region/IsolatedRegionGenerator');
const RegionFactory = require('../lib/region/RegionFactory');
const TripsVisualizer = require('../lib/visualize/TripsVisualizer');
const DistanceHelpers = require('../lib/util/DistanceHelpers');

const ParameterizedStopsGenerator = require('../lib/stop/ParameterizedStopsGenerator');
const RandomStopsGenerator = require('../lib/stop/RandomStopsGenerator');

const ParameterizedEdgesGenerator = require('../lib/edge/ParameterizedEdgesGenerator');
const RandomEdgesGenerator = require('../lib/edge/RandomEdgesGenerator');

const RandomRoutesGenerator = require('../lib/route/RandomRoutesGenerator');
const ParameterizedRoutesGenerator = require('../lib/route/ParameterizedRoutesGenerator');

const RandomConnectionsGenerator = require('../lib/connection/RandomConnectionsGenerator');
const ParameterizedConnectionsGenerator = require('../lib/connection/ParameterizedConnectionsGenerator');
const GtfsBuilder = require('../lib/gtfs/GtfsBuilder');

const Evaluator = require('../lib/evaluate/Evaluator');
const GtfsGenerator = require('../lib/GtfsGenerator');

function generateRegion() {
  new TripsVisualizer(new NoisyRegionGenerator().generate().getRegion(), false, false, false, false, 1, true).render("region_noisy.png");
  new TripsVisualizer(new IsolatedRegionGenerator().generate().getRegion(), false, false, false, false, 1, true).render("region_isolated.png");
}

function generateAll() {
  new GtfsGenerator({
    "region:region_generator": 'file',
    "region:region_file_path": 'region_BE.csv',
    "stops:stops": 1000,
    "edges:loosestations_max_range_factor": 0.5,
    "routes:routes": 2000,
    "routes:largest_stations_fraction": 0.05,
    "connections:time_initial": 1451606400000,
    "connections:time_final": 1454284800000,
    "connections:delay_chance": 0.1,
    "queryset:generate": true
  }).generate('output_data');
}

//generateRegion();
generateAll();