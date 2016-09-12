'use strict';

const RegionFactory = require('../lib/RegionFactory.js');
const TripsVisualizer = require('../lib/TripsVisualizer.js');
const DistanceHelpers = require('../lib/DistanceHelpers.js');

const ParameterizedStopsGenerator = require('../lib/ParameterizedStopsGenerator.js');
const RandomStopsGenerator = require('../lib/RandomStopsGenerator.js');

const ParameterizedEdgesGenerator = require('../lib/ParameterizedEdgesGenerator.js');
const RandomEdgesGenerator = require('../lib/RandomEdgesGenerator.js');

// Generate stops based on population distribution
function getParameterizedStops() {
  return new Promise((resolve, reject) => {
    new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
      var generator_stops = new ParameterizedStopsGenerator(region);
      generator_stops.generate();

      var generator_edges = new ParameterizedEdgesGenerator(region);
      generator_edges.generate();
      var edges = generator_edges.getEdges();

      generator_stops.generatePostEdges(edges);

      resolve(region.getStations());
      new TripsVisualizer(region, edges).render("stops_parameterized.png");
    });
  });
}

// Generate stops at random
function getRandomStops() {
    return new Promise((resolve, reject) => {
        new RegionFactory('input_data/region_cells.csv').createRegion((region) => {
            new RandomStopsGenerator(region).generate();
            resolve(region.getStations());
            //new TripsVisualizer(region).render("stops_random.png");
        });
    });
}

// Load golden standard of stops
function getGoldenStandardStops() {
    return new Promise((resolve, reject) => {
        new RegionFactory('input_data/region_cells.csv', true).createRegion((region) => {
            resolve(region.getStations());
            //new TripsVisualizer(region).render("stops_gs.png");
        });
    });
}

Promise.all([
    getParameterizedStops(),
    getRandomStops(),
    getGoldenStandardStops()
])
    .then(([parameterizedStops, randomStops, goldenStandardStops]) => {
        console.log("PARAM: " + parameterizedStops.length); // TODO
        console.log("RAND: " + randomStops.length); // TODO
        console.log("GS: " + goldenStandardStops.length); // TODO

        // Compare the two stop lists with the golden standard (calculate distance)
        var distance_param = DistanceHelpers.points(parameterizedStops, goldenStandardStops, DistanceHelpers.point2D);
        var distance_rand = DistanceHelpers.points(randomStops, goldenStandardStops, DistanceHelpers.point2D);
        console.log("PARAM distance: " + distance_param); // TODO
        console.log("RAND distance: " + distance_rand); // TODO
    })
    .catch(err => {
        console.error(err);
    });

/*
// Generate edges at random
function getRandomEdges() {
  return new Promise((resolve, reject) => {
    new RegionFactory('input_data/region_cells.csv', true).createRegion((region) => {
      var generator = new RandomEdgesGenerator(region);
      generator.generate();
      var edges = generator.getEdges();
      //new TripsVisualizer(region, edges).render("edges_random.png");
      resolve(edges);
    });
  });
}

// Generate edges by clustering
function getParameterizedEdges() {
  return new Promise((resolve, reject) => {
    new RegionFactory('input_data/region_cells.csv', true).createRegion((region) => {
      var generator = new ParameterizedEdgesGenerator(region);
      generator.generate();
      var edges = generator.getEdges();
      new TripsVisualizer(region, edges, generator.debugpoints).render("edges_parameterized.png");
      resolve(edges);
    });
  });
}

// Load golden standard of edges
function getGoldenStandardEdges() {
  return new Promise((resolve, reject) => {
    new RegionFactory('input_data/region_cells.csv', true, true).createRegion((region, edges) => {
      //new TripsVisualizer(region, edges).render("edges_gs.png");
      resolve(edges);
    });
  });
}

Promise.all([
  getParameterizedEdges(),
  getRandomEdges(),
  getGoldenStandardEdges()
])
  .then(([parameterizedEdges, randomEdges, goldenStandardEdges]) => {
    console.log("PARAM: " + parameterizedEdges.length); // TODO
    console.log("RAND: " + randomEdges.length); // TODO
    console.log("GS: " + goldenStandardEdges.length); // TODO

    // Compare the two edge lists with the golden standard (calculate distance)
    var distance_param = DistanceHelpers.points(parameterizedEdges, goldenStandardEdges, DistanceHelpers.line2D);
    var distance_rand = DistanceHelpers.points(randomEdges, goldenStandardEdges, DistanceHelpers.line2D);
    console.log("PARAM distance: " + distance_param); // TODO
    console.log("RAND distance: " + distance_rand); // TODO
  })
  .catch(err => {
    console.error(err);
  });*/