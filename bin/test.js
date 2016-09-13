'use strict';

const Point = require('../lib/util/Point.js');
const DistanceHelpers = require('../lib/util/DistanceHelpers.js');

var A = [];
var B = [];
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 100; j++) {
        A.push(new Point(i, j, 0));
        B.push(new Point(i + Math.random() * 100, j + Math.random() * 100, 0));
    }
}

console.log(DistanceHelpers.points(A, B, DistanceHelpers.point2D)); // TODO

var Al = [];
var Bl = [];
for (var i = 0; i < 100; i++) {
    for (var j = 0; j < 100; j++) {
        Al.push({ from: new Point(i, j, 0), to: new Point(i + 10, j + 10, 0) });
        Bl.push({ from: new Point(i + Math.random() * 100, j + Math.random() * 100, 0), to: new Point(i + 10 + Math.random() * 100, j + 10 + Math.random() * 100, 0) });
    }
}

console.log(DistanceHelpers.points(Al, Bl, DistanceHelpers.line2D)); // TODO

