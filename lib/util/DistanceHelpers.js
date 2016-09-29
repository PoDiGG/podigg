'use strict';

class DistanceHelpers {
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