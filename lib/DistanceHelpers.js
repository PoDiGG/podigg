'use strict';

class DistanceHelpers {
    static point2D(a, b) {
        return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    }

    static line2D(a, b) {
        var length_a = DistanceHelpers.point2D(a.from, a.to);
        var length_b = DistanceHelpers.point2D(b.from, b.to);
        return Math.min(DistanceHelpers.point2D(a.from, b.from) + DistanceHelpers.point2D(a.to, b.to), DistanceHelpers.point2D(a.from, b.to) + DistanceHelpers.point2D(a.to, b.from)) * (1 + Math.abs(length_a - length_b));
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

    static points(A, B, d) {
        var sum = 0;
        sum += A.reduce((prev, a) => {
            return prev + DistanceHelpers.point(a, DistanceHelpers.findClosestPoint(a, B, d), d);
        }, 0);
        sum += B.reduce((prev, b) => {
            return prev + DistanceHelpers.point(b, DistanceHelpers.findClosestPoint(b, A, d), d);
        }, 0);
        return sum / (A.length + B.length);
    }
}

module.exports = DistanceHelpers;