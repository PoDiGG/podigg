'use strict';

const fs = require('fs');
const csvparse = require('csv-parse');
const transform = require('stream-transform');

const StopsGenerator = require('./StopsGenerator.js');
const Region = require('./Region.js');
const Point = require('./Point.js');
const TripsVisualizer = require('./TripsVisualizer.js');

class RegionFactory {
    constructor(region_cells_filepath) {
        this.region_cells_filepath = region_cells_filepath;
    }

    createRegion(cb) {
        this.prepareData(new Region(), cb);
    }

    prepareData(region, cb) {
        var parser = csvparse({delimiter: ','});
        var input = fs.createReadStream(this.region_cells_filepath);
        var transformer = transform((record, callback) => {
            if (record[0] != 'x') {
                var point = new Point(parseInt(record[0]), parseInt(record[1]), parseFloat(record[4]));
                if (point.value > 0) point.value = Math.log(point.value + 1);
                region.put(point);
            }
            callback(null);
        }, () => {});

        input.pipe(parser).pipe(transformer).on('finish', () => {
            setImmediate(() => {
                region.points.sort(function(a, b) {
                    return b.value - a.value;
                });
                cb(region);
            });
        });
    }
}

module.exports = RegionFactory;