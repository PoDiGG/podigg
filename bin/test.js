'use strict';

const Point = require('../lib/Point.js');
const DistanceHelpers = require('../lib/DistanceHelpers.js');

var A = [];
var B = [];
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 100; j++) {
        A.push(new Point(i, j, 0));
        B.push(new Point(i + Math.random() * 100, j + Math.random() * 100, 0));
    }
}

console.log(DistanceHelpers.points(A, B, DistanceHelpers.point2D)); // TODO

