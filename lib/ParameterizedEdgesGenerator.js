'use strict';

const EdgesGenerator = require('./EdgesGenerator.js');
const Point = require('../lib/Point.js');
const DistanceHelpers = require('../lib/DistanceHelpers.js');

class ParameterizedEdgesGenerator extends EdgesGenerator {
    constructor(region) {
        super(region);

        this.param_seed = 1; // Random seed
        this.param_edges = 600; // The number of edges to generate
        this.param_max_intracluster_distance = 100; // The maximum distance stations in one cluster can have from each other.
        this.param_max_intracluster_distance_growthfactor = 0.1; // The factor the param_max_intracluster_distance should grow in each step. (until 1 is reached) The lower this value, the larger the chance that closer stations will be clustered first before further away stations.
        this.param_post_cluster_max_intracluster_distancefactor = 1.1; // Maximum distance clusters can have in the post step. The larger the value, the larger the chance that a cluster will be connected to more clusters.
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
        this.edges.push({ from: closest1, to: closest2 });
        closest1.edges++;
        closest2.edges++;

        return { stations: stations, center: { x: avgX, y: avgY } };
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
        console.log("clusters: " + clusters.length); // TODO

        // Merge clusters until not possible anymore
        var merged = true;
        var intracluster_distance_factor = 0;
        while (merged) {
            merged = false;
            var newClusters = [];
            var clusteredIndexes = [];
            intracluster_distance_factor = Math.min(1, intracluster_distance_factor + this.param_max_intracluster_distance_growthfactor);
            // Merge closest clusters
            for (var i = 0; i < clusters.length; i++) {
                var cluster1 = clusters[i];
                if (clusteredIndexes.indexOf(i) < 0) {
                    for (var j = 0; j < i; j++) {
                        var cluster2 = clusters[j];
                        if (clusteredIndexes.indexOf(j) < 0 && this.getCenteredClusterDistance(cluster1, cluster2) <= (this.param_max_intracluster_distance * intracluster_distance_factor)) {
                            newClusters.push(this.mergeClusters(cluster1, cluster2));
                            clusteredIndexes.push(i);
                            clusteredIndexes.push(j);
                            merged = true;
                        }
                    }
                }
            }
            merged = merged || intracluster_distance_factor < 1;

            if (merged) {
                // Add all untouched clusters
                for (var i = 0; i < clusters.length; i++) {
                    if (clusteredIndexes.indexOf(i) < 0) {
                        newClusters.push(clusters[i]);
                    }
                }
                clusters = newClusters;
                console.log("clusters: " + clusters.length); // TODO
            }
        }

        // TODO: modify so that chances are larger for edges to be continuous, instead of branched

        // Another clustering phase: Connect clusters based on border stations (stations with #edges <= 1)
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
                    if (distance <= cluster2.minDistance && distance <= cluster1.minDistance) {
                        cluster1 = this.mergeClusters(cluster1, cluster2);
                    } else {
                        newClusters.push(cluster2);
                    }
                }
            }
            newClusters.push(cluster1);
            clusters = newClusters;

            console.log("clusters2: " + clusters.length); // TODO
        }
    }
}

module.exports = ParameterizedEdgesGenerator;