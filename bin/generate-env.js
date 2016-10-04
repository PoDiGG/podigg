'use strict';

const GtfsGenerator = require('../lib/GtfsGenerator');

/* Invoke the generator based on environment variables. */

var config = {};
for (var env in process.env) {
  var prefixPos = env.indexOf('GTFS_GEN_');
  if (prefixPos == 0) {
    var name = env.slice('GTFS_GEN_'.length, env.length);
    var split = name.split('__');
    var configKey = split.length == 2 ? split[0].toLowerCase() + ":" + split[1].toLowerCase() : name.toLowerCase();
    config[configKey] = process.env[env];
  }
}

new GtfsGenerator(config).generate('output_data');

