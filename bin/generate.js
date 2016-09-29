'use strict';

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

function generateStops() {
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
}

function generateEdges() {
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
        new TripsVisualizer(region, edges, null, null, generator.debugpoints).render("edges_parameterized.png");
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
    });
}

function generateRoutes() {
  // Generate routes at random
  function getRandomRoutes() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true, true).createRegion((region, edges) => {
        var generator = new RandomRoutesGenerator(region, edges);
        generator.generate();
        var routes = generator.getRoutes();
        //new TripsVisualizer(region, edges, routes).render("routes_random.png");
        resolve(routes);
      });
    });
  }

  // Generate routes using path finding
  function getParameterizedRoutes() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true).createRegion((region) => {
        var edgesGenerator = new ParameterizedEdgesGenerator(region);
        edgesGenerator.generate();
        var edges = edgesGenerator.getEdges();

        var generator = new ParameterizedRoutesGenerator(region, edges);
        generator.generate();
        var routes = generator.getRoutes();
        new TripsVisualizer(region, edges, routes, null, generator.debugpoints).render("routes_parameterized.png");
        resolve(routes);
      });
    });
  }

  // Load golden standard of edges
  function getGoldenStandardRoutes() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true, true).createRegion((region, edges, routes) => {
        //new TripsVisualizer(region, edges, routes).render("routes_gs.png");
        resolve(routes);
      });
    });
  }

  Promise.all([
    getParameterizedRoutes(),
    getRandomRoutes(),
    getGoldenStandardRoutes()
  ])
    .then(([parameterizedRoutes, randomRoutes, goldenStandardRoutes]) => {
      console.log("PARAM: " + parameterizedRoutes.length); // TODO
      console.log("RAND: " + randomRoutes.length); // TODO
      console.log("GS: " + goldenStandardRoutes.length); // TODO

      // Wrap distance functions in caches in an attempt to speed up calculations. (Makes it slower...)
      /*var maxRoutes = Math.max(randomRoutes.length, goldenStandardRoutes.length);
       var maxY = 1000; // TODO: calc exact
       var maxEdges = 50000; // TODO: calc exact
       var pointDistanceCached = DistanceHelpers.cachedDistance(DistanceHelpers.point2D, (point1, point2) => {
       return (point1.x + point2.x) * maxY + (point1.y + point2.y);
       });
       var lineDistance = DistanceHelpers.line2DCustomD(DistanceHelpers.point2D);
       var lineDistanceCached = DistanceHelpers.cachedDistance(lineDistance, (line1, line2) => {
       var minId = Math.min(line1.edgeId, line2.edgeId);
       var maxId = Math.max(line1.edgeId, line2.edgeId);
       return (minId + maxEdges) * maxId;
       });
       var routeDistance = (route1, route2) => DistanceHelpers.points(route1.edges, route2.edges, lineDistance);
       var routeDistanceCached = DistanceHelpers.cachedDistance(routeDistance, (route1, route2) => {
       var minId = Math.min(route1.routeId, route2.routeId);
       var maxId = Math.max(route1.routeId, route2.routeId);
       return (minId + maxRoutes) * maxId;
       });*/
      var routeDistance = (route1, route2) => DistanceHelpers.points(route1.edges, route2.edges, DistanceHelpers.line2DCustomD(DistanceHelpers.point2D));

      // Compare the two edge lists with the golden standard (calculate distance)
      //var distance_rand = DistanceHelpers.points(randomRoutes, goldenStandardRoutes, routeDistance);
      //console.log("RAND distance: " + distance_rand); // TODO
    })
    .catch(err => {
      console.error(err);
    });
}

function generateConnections() {
  // Generate connections at random
  function getRandomConnections() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true, true).createRegion((region, edges, routes) => {
        var generator = new RandomConnectionsGenerator(region, routes);
        generator.generate();
        var connections = generator.getConnections();
        new TripsVisualizer(region, edges, routes, connections).render("connections_random.png");
        resolve(connections);
      });
    });
  }

  // Generate connections
  function getParameterizedConnections() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true).createRegion((region, edges, routes) => {
        /*var edgesGenerator = new ParameterizedEdgesGenerator(region);
        edgesGenerator.generate();
        var edges = edgesGenerator.getEdges();

        var routesGenerator = new ParameterizedRoutesGenerator(region, edges);
        routesGenerator.generate();
        var routes = routesGenerator.getRoutes();*/

        var connections = [];// TODO

        //new TripsVisualizer(region, edges, routes, connections).render("connections_parameterized.png");

        resolve(connections);
      });
    });
  }

  // Load golden standard of connections
  function getGoldenStandardConnections() {
    return new Promise((resolve, reject) => {
      new RegionFactory('input_data/region_cells.csv', true, true).createRegion((region, edges, routes, connections) => {
        new TripsVisualizer(region, edges, routes, connections).render("connections_gs.png");
        resolve(connections);
      });
    });
  }

  Promise.all([
    getParameterizedConnections(),
    getRandomConnections(),
    getGoldenStandardConnections()
  ])
    .then(([parameterizedConnections, randomConnections, goldenStandardConnections]) => {
      console.log("PARAM: " + parameterizedConnections.length); // TODO
      console.log("RAND: " + randomConnections.length); // TODO
      console.log("GS: " + goldenStandardConnections.length); // TODO
    })
    .catch(err => {
      console.error(err);
    });
}

//generateStops();
//generateEdges();
//generateRoutes();
generateConnections();