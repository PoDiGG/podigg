'use strict';

class DistanceHelpers {
    static newPointToLatLonConverter(lat_offset, lon_offset, cells_per_latlon) {
        return (point) => {
            var lat = lat_offset + point.x / cells_per_latlon;
            var lon = lon_offset + point.y / cells_per_latlon;
            return [ lat, lon ];
        };
    }

    static degreesToRadians(x) {
        return x * Math.PI / 180;
    };

    static point2DHaversine(point1, point2, pointToLatLon) {
        var [lat1, long1] = pointToLatLon(point1);
        var [lat2, long2] = pointToLatLon(point2);

        var dLat = DistanceHelpers.degreesToRadians(lat2 - lat1);
        var dLon = DistanceHelpers.degreesToRadians(long2 - long1);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(DistanceHelpers.degreesToRadians(lat1)) *
          Math.cos(DistanceHelpers.degreesToRadians(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);

        return 12742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // In km
    };

    static point2D(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    }

    static cachedDistance(d, cacheIdRetriever) {
        var cache = {};
        return (a, b) => {
            var cacheId = cacheIdRetriever(a, b);
            var distance = cache[cacheId];
            if (!distance) {
                distance = d(a, b);
                cache[cacheId] = distance;
            }
            return distance;
        };
    }

    static line2DCustomD(d) {
        return (a, b) => {
            var length_a = d(a.from, a.to);
            var length_b = d(b.from, b.to);
            return Math.min(d(a.from, b.from)
                + d(a.to, b.to), d(a.from, b.to)
                + d(a.to, b.from)) * (1 + Math.abs(length_a - length_b));
        };
    }

    static point(a, b, d) {
        return d(a, b);
    }

    static findClosestPoint(a, B, d) {
        return B.reduce(({dMin, element}, b) => {
            var dThis = d(a, b);
            if (dThis < dMin) {
                dMin = dThis;
                element = b;
            }
            return { dMin: dMin, element: element };
        }, { dMin: Number.MAX_SAFE_INTEGER, element: null }).element;
    }

    static points(A, B, d, closestPointFinder1, closestPointFinder2) {
        if (!closestPointFinder1) closestPointFinder1 = DistanceHelpers.findClosestPoint;
        if (!closestPointFinder2) closestPointFinder2 = closestPointFinder1;
        var sum = 0;
        sum += A.reduce((prev, a, i) => {
            return prev + DistanceHelpers.point(a, closestPointFinder1(a, B, d), d);
        }, 0);
        sum += B.reduce((prev, b, i) => {
            return prev + DistanceHelpers.point(b, closestPointFinder2(b, A, d), d);
        }, 0);
        return sum / (A.length + B.length);
    }

    static iterateMatrixRadial(matrix, x_c, y_c, radius_max, cb) {
        var steps = [
            { x:  1, y:  0 },
            { x:  0, y:  1 },
            { x: -1, y:  0 },
            { x:  0, y: -1 }
        ];

        var x = x_c;
        var y = y_c;
        var radius = 1;
        while (radius < radius_max) {
            var step_i = 0;
            while (step_i < steps.length) {
                var step = steps[step_i];
                while ((x + step.x <= x_c + radius && x + step.x >= x_c - radius)
                    && (y + step.y <= y_c + radius && y + step.y >= y_c - radius)) {
                    x += step.x;
                    y += step.y;
                    var row = matrix[x];
                    if (row) {
                        var val = row[y];
                        if (val && cb(val, radius)) {
                            return;
                        }
                    }
                }
                step_i++;
            }
            radius++;
        }
    }
}

DistanceHelpers.line2D = DistanceHelpers.line2DCustomD(DistanceHelpers.point2D);

module.exports = DistanceHelpers;