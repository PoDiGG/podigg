'use strict';

const Point = require('../lib/Point.js');

class Region {

    constructor() {
        this._data = [];
        this.max = new Point(0, 0);
        this.points = [];
    }

    put(point) {
        var x = point.x;
        var y = point.y;
        var size = point.size;
        var row = this._data[x];
        if (!row) {
            row = [];
            this._data[x] = row;
        }
        row[y] = { size: size, station: false };
        this.max = new Point(Math.max(this.max.x, x), Math.max(this.max.y, y));
        this.points.push(point);
    }

    getRaw(x, y) {
        var row = this._data[x];
        if (!row) {
            return null;
        }
        return row[y];
    }

    getSize(x, y) {
        return (this.getRaw(x, y) || {}).size;
    }

    isStation(x, y) {
        return (this.getRaw(x, y) || {}).station;
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
                    if (element && (xSym != xCenter || ySym != yCenter) && (element.size || 0) >= minValue) {
                        points.push(new Point(xSym, ySym, element.size));
                    }
                }
            }
        }
        return points;
    }

    getStations() {
        var stations = [];
        for (var i = 0; i < this._data.length; i++) {
            var row = this._data[i];
            for (var j = 0; j < row.length; j++) {
                var element = row[j];
                if (element && element.station) {
                    stations.push({ x: i, y: j});
                }
            }
        }
        return stations;
    }

}

module.exports = Region;
