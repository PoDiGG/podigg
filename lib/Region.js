'use strict';

const Point = require('../lib/Point.js');

class Region {

    constructor() {
        this._data  = [];
        this.max = new Point(0, 0);
    }

    put(x, y, size) {
        var row = this._data[x];
        if (!row) {
            row = [];
            this._data[x] = row;
        }
        row[y] = { size: size, station: false };
        this.max = new Point(Math.max(this.max.x, x), Math.max(this.max.y, y));
    }

    getRaw(x, y) {
        var row = this._data[x];
        if (!row) {
            return null;
        }
        return row[y];
    }

    getSize(x, y) {
        return getRaw(x, y).size;
    }

    isStation(x, y) {
        return getRaw(x, y).station;
    }

    markStation(x, y) {
        this._data[x][y].station = true;
    }

    getPointsInRegion(xCenter, yCenter, radius, minValue) {
        var points = [];
        for (var x = xCenter - radius; x <= xCenter + radius; x++) {
            for (var y = yCenter - radius ;y <= yCenter + radius; y++) {
                if ((x - xCenter) * (x - xCenter) + (y - yCenter) * (y - yCenter) <= radius * radius) {
                    var xSym = xCenter - (x - xCenter);
                    var ySym = yCenter - (y - yCenter);
                    var element = this.getRaw(xSym, ySym);
                    if (element && (xSym != xCenter || ySym != yCenter) && element.size >= minValue) {
                        points.push(new Point(xSym, ySym, element.size));
                    }
                }
            }
        }
        return points;
    }

}

module.exports = Region;
