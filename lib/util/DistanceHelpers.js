'use strict';

class DistanceHelpers {
    static newPointToLatLonConverter(lat_offset, lon_offset, latlon_per_cell) {
        return (point) => {
            var lat = lat_offset + point.x / latlon_per_cell;
            var lon = lon_offset + point.y / latlon_per_cell;
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

    static points(A, B, d, closestPointFinder) {
        if (!closestPointFinder) closestPointFinder = DistanceHelpers.findClosestPoint;
        var sum = 0;
        sum += A.reduce((prev, a, i) => {
            return prev + DistanceHelpers.point(a, closestPointFinder(a, B, d), d);
        }, 0);
        sum += B.reduce((prev, b, i) => {
            return prev + DistanceHelpers.point(b, closestPointFinder(b, A, d), d);
        }, 0);
        return sum / (A.length + B.length);
    }
}

DistanceHelpers.line2D = DistanceHelpers.line2DCustomD(DistanceHelpers.point2D);

module.exports = DistanceHelpers;