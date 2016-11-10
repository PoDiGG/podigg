'use strict';

const NoisyRegionGenerator = require('../region/NoisyRegionGenerator');
const IsolatedRegionGenerator = require('../region/IsolatedRegionGenerator');
const RegionFactory = require('../region/RegionFactory');
const TripsVisualizer = require('../visualize/TripsVisualizer');
const DistanceHelpers = require('../util/DistanceHelpers');

const ParameterizedStopsGenerator = require('../stop/ParameterizedStopsGenerator');
const RandomStopsGenerator = require('../stop/RandomStopsGenerator');

const ParameterizedEdgesGenerator = require('../edge/ParameterizedEdgesGenerator');
const RandomEdgesGenerator = require('../edge/RandomEdgesGenerator');

const RandomRoutesGenerator = require('../route/RandomRoutesGenerator');
const ParameterizedRoutesGenerator = require('../route/ParameterizedRoutesGenerator');

const RandomConnectionsGenerator = require('../connection/RandomConnectionsGenerator');
const ParameterizedConnectionsGenerator = require('../connection/ParameterizedConnectionsGenerator');
const GtfsBuilder = require('../gtfs/GtfsBuilder');

const GtfsGenerator = require('../GtfsGenerator');

/* An Evaluator evaluates each step of the generator. */
class Evaluator {
    constructor(path_cells, path_edges, options) {
        this.path_cells = path_cells;
        this.path_edges = path_edges;
        this.options = options || {};
    }

    evaluateAll() {
        return [
            () => this.evaluateStops(),
            () => this.evaluateEdges(),
            () => this.evaluateRoutes(),
            () => this.evaluateConnections()
        ].reduce((p, f) => p.then(f), Promise.resolve());
    }

    evaluateStops() {
        console.log("---stops---");
        var self = this;

        // Generate stops based on population distribution
        function getParameterizedStops() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges).createRegion((region) => {
                    var generator_stops = new ParameterizedStopsGenerator(region, self.options);
                    generator_stops.generate();

                    var generator_edges = new ParameterizedEdgesGenerator(region);
                    generator_edges.generate();
                    var edges = generator_edges.getEdges();

                    generator_stops.generatePostEdges(edges);

                    resolve(region.getStations());
                    new TripsVisualizer(region).render("stops_parameterized.png");
                });
            });
        }

        // Generate stops at random
        function getRandomStops() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges).createRegion((region) => {
                    new RandomStopsGenerator(region, self.options).generate();
                    resolve(region.getStations());
                    new TripsVisualizer(region).render("stops_random.png");
                });
            });
        }

        // Load golden standard of stops
        function getGoldenStandardStops() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true).createRegion((region) => {
                    resolve(region.getStations());
                    new TripsVisualizer(region).render("stops_gs.png");
                });
            });
        }

        return Promise.all([
            getParameterizedStops(),
            getRandomStops(),
            getGoldenStandardStops()
        ])
          .then(([parameterizedStops, randomStops, goldenStandardStops]) => {
              console.log("PARAM: " + parameterizedStops.length);
              console.log("RAND: " + randomStops.length);
              console.log("GS: " + goldenStandardStops.length);

              // Compare the two stop lists with the golden standard (calculate distance)
              var distance_param = DistanceHelpers.points(parameterizedStops, goldenStandardStops, DistanceHelpers.point2D);
              var distance_rand = DistanceHelpers.points(randomStops, goldenStandardStops, DistanceHelpers.point2D);
              console.log("PARAM distance: " + distance_param);
              console.log("RAND distance: " + distance_rand);
          })
          .catch(err => {
              console.error(err);
          });
    }

    evaluateEdges() {
        console.log("---edges---");
        var self = this;

        // Generate edges at random
        function getRandomEdges() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true).createRegion((region) => {
                    var generator = new RandomEdgesGenerator(region, self.options);
                    generator.generate();
                    var edges = generator.getEdges();
                    new TripsVisualizer(region, edges).render("edges_random.png");
                    resolve(edges);
                });
            });
        }

        // Generate edges by clustering
        function getParameterizedEdges() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true).createRegion((region) => {
                    var generator = new ParameterizedEdgesGenerator(region, self.options);
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
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges) => {
                    new TripsVisualizer(region, edges).render("edges_gs.png");
                    resolve(edges);
                });
            });
        }

        return Promise.all([
            getParameterizedEdges(),
            getRandomEdges(),
            getGoldenStandardEdges()
        ])
          .then(([parameterizedEdges, randomEdges, goldenStandardEdges]) => {
              console.log("PARAM: " + parameterizedEdges.length);
              console.log("RAND: " + randomEdges.length);
              console.log("GS: " + goldenStandardEdges.length);

              // Compare the two edge lists with the golden standard (calculate distance)
              var distance_param = DistanceHelpers.points(parameterizedEdges, goldenStandardEdges, DistanceHelpers.line2D);
              var distance_rand = DistanceHelpers.points(randomEdges, goldenStandardEdges, DistanceHelpers.line2D);
              console.log("PARAM distance: " + distance_param);
              console.log("RAND distance: " + distance_rand);

          })
          .catch(err => {
              console.error(err);
          });
    }

    evaluateRoutes() {
        console.log("---routes---");
        var self = this;

        // Generate routes at random
        function getRandomRoutes() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges) => {
                    var generator = new RandomRoutesGenerator(region, edges, self.options);
                    generator.generate();
                    var routes = generator.getRoutes();
                    new TripsVisualizer(region, edges, routes).render("routes_random.png");
                    resolve(routes);
                });
            });
        }

        // Generate routes using path finding
        function getParameterizedRoutes() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true).createRegion((region) => {
                    var edgesGenerator = new ParameterizedEdgesGenerator(region, self.options);
                    edgesGenerator.generate();
                    var edges = edgesGenerator.getEdges();

                    var generator = new ParameterizedRoutesGenerator(region, edges, self.options);
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
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges, routes) => {
                    new TripsVisualizer(region, edges, routes).render("routes_gs.png");
                    resolve(routes);
                });
            });
        }

        function indexRoutes(routes) {
            var routesIndex = [];
            routes.forEach(route => {
                var x = 0;
                var y = 0;
                for (var edge of route.edges) {
                    x += edge.from.x;
                    x += edge.to.x;
                    y += edge.from.y;
                    y += edge.to.y;
                }
                x = Math.floor(x / (route.edges.length * 2));
                y = Math.floor(y / (route.edges.length * 2));
                route.center = { x: x, y: y };
                var row = routesIndex[x];
                if (!row) {
                    row = routesIndex[x] = [];
                }
                row[y] = route;
            });
            return routesIndex;
        }

        function newClosestRouteFinder(routesIndex, radius_max) {
            return (route, routes) => {
                var closest = null;
                DistanceHelpers.iterateMatrixRadial(routesIndex, route.center.x, route.center.y, radius_max, (element, distance) => {
                    closest = element;
                    return true;
                });
                return closest;
            };
        }

        return Promise.all([
            getParameterizedRoutes(),
            getRandomRoutes(),
            getGoldenStandardRoutes()
        ])
          .then(([parameterizedRoutes, randomRoutes, goldenStandardRoutes]) => {
              console.log("PARAM: " + parameterizedRoutes.length);
              console.log("RAND: " + randomRoutes.length);
              console.log("GS: " + goldenStandardRoutes.length);

              var goldenStandardIndex = indexRoutes(goldenStandardRoutes);
              var parameterizedIndex = indexRoutes(parameterizedRoutes);
              var randomIndex = indexRoutes(randomRoutes);

              var routeDistance = (route1, route2) => (DistanceHelpers.points(route1.edges, route2.edges, DistanceHelpers.line2DCustomD(DistanceHelpers.point2D)) / (route1.edges.length + route2.edges.length));

              // Compare the two edge lists with the golden standard (calculate distance)
              var distance_param = DistanceHelpers.points(parameterizedRoutes, goldenStandardRoutes, routeDistance, newClosestRouteFinder(goldenStandardIndex, goldenStandardRoutes.length / 2), newClosestRouteFinder(parameterizedIndex, parameterizedRoutes.length / 2));
              var distance_rand = DistanceHelpers.points(randomRoutes, goldenStandardRoutes, routeDistance, newClosestRouteFinder(goldenStandardIndex, goldenStandardRoutes.length / 2), newClosestRouteFinder(randomIndex, randomRoutes.length / 2));
              console.log("PARAM distance: " + distance_param);
              console.log("RAND distance: " + distance_rand);
          })
          .catch(err => {
              console.error(err);
          });
    }

    evaluateConnections() {
        console.log("---connections---");
        var self = this;

        // Generate connections at random
        function getRandomConnections() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges, routes) => {
                    var generator = new RandomConnectionsGenerator(region, routes, self.options);
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
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges, routes) => {
                    var pointToLatLon = DistanceHelpers.newPointToLatLonConverter(self.options['region:lat_offset'] || 0, self.options['region:lon_offset'] || 0, self.options['region:cells_per_latlon'] || 100);
                    var generator = new ParameterizedConnectionsGenerator(region, routes, pointToLatLon, self.options);
                    generator.generate();
                    var connections = generator.getConnections();
                    new TripsVisualizer(region, edges, routes, connections).render("connections_parameterized.png");
                    resolve(connections);
                });
            });
        }

        // Load golden standard of connections
        function getGoldenStandardConnections() {
            return new Promise((resolve, reject) => {
                new RegionFactory(self.path_cells, self.path_edges, true, true).createRegion((region, edges, routes, connections) => {
                    new TripsVisualizer(region, edges, routes, connections).render("connections_gs.png");
                    resolve(connections);
                });
            });
        }

        function printTimeDistributions(parameterizedConnections, randomConnections, goldenStandardConnections) {
            var hours_param = [];
            var hours_rand = [];
            var hours_gs = [];
            fillHistogram(parameterizedConnections, hours_param);
            fillHistogram(randomConnections, hours_rand);
            fillHistogram(goldenStandardConnections, hours_gs);

            printHistograms(hours_param, hours_rand, hours_gs);

            function fillHistogram(connections, hist) {
                for (var conn of connections) {
                    var hour = new Date(conn.departureTime).getHours();
                    if (!hist[hour]) hist[hour] = 0;
                    hist[hour]++;
                }
            }

            function printHistograms(hist_param, hist_rand, hist_gs) {
                console.log("hour,param,rand,gs");
                for (var i = 0; i < 24; i++) {
                    console.log(i + "," + (hist_param[i] || 0) + "," + (hist_rand[i] || 0) + "," + (hist_gs[i] || 0));
                }
            }
        }

        return Promise.all([
            getParameterizedConnections(),
            getRandomConnections(),
            getGoldenStandardConnections()
        ])
          .then(([parameterizedConnections, randomConnections, goldenStandardConnections]) => {
              console.log("PARAM: " + parameterizedConnections.length);
              console.log("RAND: " + randomConnections.length);
              console.log("GS: " + goldenStandardConnections.length);

              var connectionDistance = (c1, c2) => {
                  var distanceTime = (c1.departureTime - c2.departureTime) + (c1.arrivalTime - c2.arrivalTime);
                  var distanceTrip = DistanceHelpers.line2D(c1.trip, c2.trip);
                  return distanceTime / 60000 + distanceTrip;
              };
              var closestConnectionFinder = (connection, connections) => {
                  var minIndex = 0;
                  var maxIndex = connections.length - 1;
                  var currentIndex;
                  var currentElement;

                  var smallestDistance = Number.MAX_SAFE_INTEGER;
                  var closestElement = null;

                  // Binary search
                  while (minIndex <= maxIndex) {
                      currentIndex = (minIndex + maxIndex) / 2 | 0;
                      currentElement = connections[currentIndex];

                      var d = Math.abs((currentElement.departureTime - connection.departureTime) + (currentElement.arrivalTime - connection.arrivalTime));
                      if (d < smallestDistance) {
                          smallestDistance = d;
                          closestElement = currentElement;
                      } else if (closestElement && d > smallestDistance) {
                          return closestElement;
                      }
                      if (currentElement.departureTime < connection.departureTime) {
                          minIndex = currentIndex + 1;
                      }
                      else if (currentElement.departureTime > connection.departureTime) {
                          maxIndex = currentIndex - 1;
                      }
                      else {
                          return connections[currentIndex];
                      }
                  }
                  return closestElement;
              };
              console.log("PARAM distance: " + DistanceHelpers.points(parameterizedConnections, goldenStandardConnections, connectionDistance, closestConnectionFinder));
              console.log("RAND distance: " + DistanceHelpers.points(randomConnections, goldenStandardConnections, connectionDistance, closestConnectionFinder));

              console.log("Effective time distributions of connections:");
              printTimeDistributions(parameterizedConnections, randomConnections, goldenStandardConnections);
          })
          .catch(err => {
              console.error(err);
          });
    }

}

module.exports = Evaluator;