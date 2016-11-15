'use strict';

const Config = require('../util/Config.js');
const EdgesGenerator = require('./EdgesGenerator.js');
const DistanceHelpers = require('../util/DistanceHelpers.js');
const winston = require('winston');

class ParameterizedEdgesGenerator extends EdgesGenerator {
    constructor(region, config) {
        super(region);

        var param_scope = "edges:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_max_intracluster_distance = Config.value(config, param_scope + 'max_intracluster_distance', 100); // The maximum distance stations in one cluster can have from each other.
        this.param_max_intracluster_distance_growthfactor = Config.value(config, param_scope + 'max_intracluster_distance_growthfactor', 0.1); // The factor the param_max_intracluster_distance should grow in each step. (until 1 is reached) The lower this value, the larger the chance that closer stations will be clustered first before further away stations.
        this.param_post_cluster_max_intracluster_distancefactor = Config.value(config, param_scope + 'post_cluster_max_intracluster_distancefactor', 1.5); // Maximum distance clusters can have in the post step. The larger the value, the larger the chance that a cluster will be connected to more clusters.

        this.param_loosestations_neighbourcount = Config.value(config, param_scope + 'loosestations_neighbourcount', 5); // The number of neighbours around a loose station that should define its area.
        this.param_loosestation_max_range_factor = Config.value(config, param_scope + 'loosestations_max_range_factor', 0.3); // The maximum range to check around a loose station relative to the total region size.
        this.param_loosestation_max_iterations = Config.value(config, param_scope + 'loosestations_max_iterations', 10); // The max number of iterations for one loose station.
        this.param_loosestation_search_radius_factor = Config.value(config, param_scope + 'loosestations_search_radius_factor', 0.5); // The number to multiply with the area size to get the search radius for each step.

        this.debugpoints = [];
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    getCenteredClusterDistance(cluster1, cluster2) {
        return DistanceHelpers.point2D(cluster1.center, cluster2.center);
    }

    getMinClusterDistance(cluster1, cluster2) {
        var [ closest1, closest2 ] = this.getClosestStations(cluster1.stations, cluster2.stations);
        return DistanceHelpers.point2D(closest1, closest2);
    }

    mergeClusters(cluster1, cluster2) {
        var stations = cluster1.stations.concat(cluster2.stations);
        var totalX = 0;
        var totalY = 0;
        for (var i = 0; i < stations.length; i++) {
            var station = stations[i];
            totalX += station.x;
            totalY += station.y;
        }
        var avgX = totalX / stations.length;
        var avgY = totalY / stations.length;

        var [ closest1, closest2 ] = this.getClosestStations(cluster1.stations, cluster2.stations);
        this.addEdge(closest1, closest2);
        closest1.edges++;
        closest2.edges++;

        return { stations: stations, center: { x: avgX, y: avgY } };
    }

    getFurthestStation(station, stations) {
        var furthest = null;
        var maxDistance = 0;
        for (var j = 0; j < stations.length; j++) {
            var station2 = stations[j];
            var distance = DistanceHelpers.point2D(station, station2);
            if (distance > maxDistance) {
                maxDistance = distance;
                furthest = station2;
            }
        }
        return furthest;
    }

    getClosestStation(station, stations, blacklist) {
        if (!blacklist) blacklist = [];
        var closest = null;
        var minDistance = Number.MAX_SAFE_INTEGER;
        for (var j = 0; j < stations.length; j++) {
            var station2 = stations[j];
            var distance = DistanceHelpers.point2D(station, station2);
            if (distance < minDistance && blacklist.indexOf(station2) < 0) {
                minDistance = distance;
                closest = station2;
            }
        }
        return closest;
    }

    getClosestStations(stations1, stations2) {
        var closest = [];
        var minDistance = Number.MAX_SAFE_INTEGER;
        for (var i = 0; i < stations1.length; i++) {
            var station1 = stations1[i];
            for (var j = 0; j < stations2.length; j++) {
                var station2 = stations2[j];
                var distance = DistanceHelpers.point2D(station1, station2);
                if (distance < minDistance) {
                    minDistance = distance;
                    closest = [ station1, station2 ];
                }
            }
        }
        return closest;
    }

    generate() {
        // Clustering is based on the concept of border stations: http://ad-publications.informatik.uni-freiburg.de/ALENEX_scalable_tp_BHS_2016.pdf
        // *** Agglomerative hierarchical clustering ***

        // Make a clusters for each station
        winston.log('info', 'Clustering all stops');
        var clusters = [];
        var allStations = this.region.getStations();
        for (var i = 0; i < allStations.length; i++) {
            var station = allStations[i];
            station.edges = 0;
            clusters.push({
                stations: [station],
                center: { x: station.x, y: station.y }
            });
        }

        // Merge clusters until not possible anymore
        var merged = true;
        var intracluster_distance_factor = 0;
        while (merged) {
            merged = false;
            var newClusters = [];
            var clusteredIndexes = {};
            intracluster_distance_factor = Math.min(1, intracluster_distance_factor + this.param_max_intracluster_distance_growthfactor);
            // Merge closest clusters
            for (var i = 0; i < clusters.length; i++) {
                var cluster1 = clusters[i];
                if (!clusteredIndexes[i]) {
                    for (var j = 0; j < i; j++) {
                        var cluster2 = clusters[j];
                        if (!clusteredIndexes[j] && this.getCenteredClusterDistance(cluster1, cluster2) <= (this.param_max_intracluster_distance * intracluster_distance_factor)) {
                            newClusters.push(this.mergeClusters(cluster1, cluster2));
                            clusteredIndexes[i] = true;
                            clusteredIndexes[j] = true;
                            merged = true;
                        }
                    }
                }
            }
            merged = merged || intracluster_distance_factor < 1;

            if (merged) {
                // Add all untouched clusters
                for (var i = 0; i < clusters.length; i++) {
                    if (!clusteredIndexes[i]) {
                        newClusters.push(clusters[i]);
                    }
                }
                clusters = newClusters;
            }
        }

        // Another clustering phase: Connect clusters based on border stations (stations with #edges <= 1)
        winston.log('info', 'Clustering border stations');
        while (clusters.length > 1) {
            // Calculate min cluster distances
            for (var i = 0; i < clusters.length; i++) {
                var cluster1 = clusters[i];
                var minDistance = Number.MAX_SAFE_INTEGER;
                for (var j = 0; j < i; j++) {
                    var cluster2 = clusters[j];
                    minDistance = Math.min(minDistance, this.getMinClusterDistance(cluster1, cluster2));
                }
                cluster1.minDistance = minDistance * this.param_post_cluster_max_intracluster_distancefactor;
            }

            // Merge a random cluster with its closest clusters
            var newClusters = [];
            var cluster1Index = Math.floor(this.random() * clusters.length);
            var cluster1 = clusters[cluster1Index];
            for (var j = 0; j < clusters.length; j++) {
                if (j !== cluster1Index) {
                    var cluster2 = clusters[j];
                    var distance = this.getMinClusterDistance(cluster1, cluster2);
                    var minDistance1 = cluster1.minDistance;
                    var minDistance2 = cluster2.minDistance;
                    if (distance <= minDistance1 && distance <= minDistance2) {
                        cluster1 = this.mergeClusters(cluster1, cluster2);
                        cluster1.minDistance = Math.max(minDistance1, minDistance2);
                    } else {
                        newClusters.push(cluster2);
                    }
                }
            }

            newClusters.push(cluster1);
            clusters = newClusters;
        }

        // Try to add edges from 'loose stations' (stations with only connection)
        // Do this by looking in approximately a straight direction, until another station is found in 'the area'.
        // The area is defined by the average inter-station distance of its closest X stations.
        winston.log('info', 'Connecting loose stops');
        for (var i = 0; i < allStations.length; i++) {
            var station = allStations[i];
            if (station.edges == 1) {
                // Calculate inter-station distance of closest X stations
                var closestStations = [ station ];
                var closest_first = null;
                while (closestStations.length < this.param_loosestations_neighbourcount) {
                    var closest = this.getClosestStation(station, allStations, closestStations);
                    if (!closest) break;
                    if (!closest_first) closest_first = closest;
                    closestStations.push(closest);
                }
                var avgDistance = 0;
                for (var j = 0; j < closestStations.length; j++) {
                    var station1 = closestStations[j];
                    var station2 = this.getClosestStation(station1, closestStations, [ station1 ]);
                    avgDistance += DistanceHelpers.point2D(station1, station2);
                }
                avgDistance /= closestStations.length;

                if (avgDistance > Math.max(this.region.max.x, this.region.max.y) * this.param_loosestation_max_range_factor) {
                    continue;
                }

                // Search in the direction of this station's single edge, in an area determined by avgDistance
                if (closest_first && avgDistance > 0) {
                    var searchRadius = Math.ceil(avgDistance * this.param_loosestation_search_radius_factor);
                    var dir_x = Math.ceil((station.x - closest_first.x) * this.param_loosestation_search_radius_factor);
                    var dir_y = Math.ceil((station.y - closest_first.y) * this.param_loosestation_search_radius_factor);
                    var search_center = { x: station.x, y: station.y };
                    var count = 0;
                    var connected = false;
                    while (!connected && count++ < this.param_loosestation_max_iterations && DistanceHelpers.point2D(search_center, station) < avgDistance) {
                        search_center.x += dir_x;
                        search_center.y += dir_y;
                        //this.debugpoints.push({ x: search_center.x, y: search_center.y });
                        var points = this.region.getPointsInRegion(search_center.x, search_center.y, searchRadius, 0, true);
                        while (!connected && points.length > 0) {
                            var point = points.splice(Math.floor(this.random() * points.length), 1)[0];
                            //this.debugpoints.push(point);
                            if (DistanceHelpers.point2D(station, point) > 0) {
                                //this.debugpoints.push(point);
                                this.addEdge(station, point);
                                connected = true;
                            }
                        }
                    }
                }
            }
        }
        return this;
    }
}

module.exports = ParameterizedEdgesGenerator;