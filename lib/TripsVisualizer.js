'use strict';

const fs = require('fs');
const Canvas = require('canvas');

const Point = require('./Point.js');

// Source: https://github.com/sunng87/heatcanvas/blob/master/heatcanvas.js
class RegionVisualizer {
    constructor(region, trips) {
        this.region = region;
        this.edges = trips;
    }

    render(filename) {
        if (!filename) filename = 'edges.png';
        var size = this.region.max;
        var canvas = new Canvas(size.x, size.y);
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size.x, size.y);

        var defaultColor = this.bgcolor || [0, 0, 0, 255];
        var canvasData = ctx.createImageData(size.x, size.y);
        for (var i = 0; i < canvasData.data.length; i += 4){
            canvasData.data[i  ] = defaultColor[0]; // r
            canvasData.data[i+1] = defaultColor[1];
            canvasData.data[i+2] = defaultColor[2];
            canvasData.data[i+3] = defaultColor[3];
        }

        var stopColor = [100, 255, 100, 255];
        for (var x = 0; x < size.x; x++) {
            for (var y = 0; y < size.y; y++) {
                var value = this.region._data[x][y];
                if (value && value.station) {
                    // MDC ImageData:
                    // data = [r1, g1, b1, a1, r2, g2, b2, a2 ...]
                    var pixelColorIndex = y * size.x * 4 + x * 4;

                    var color = stopColor;
                    canvasData.data[pixelColorIndex] = color[0]; // r
                    canvasData.data[pixelColorIndex + 1] = color[1]; // g
                    canvasData.data[pixelColorIndex + 2] = color[2]; // b
                    canvasData.data[pixelColorIndex + 3] = color[3]; // a
                }
            }
        }
        ctx.putImageData(canvasData, 0, 0);

        for (var i = 0; i < this.trips.length; i++) {
            var trip = this.trips[i];
            ctx.strokeStyle = 'rgba(0,0,255,255)';
            ctx.beginPath();
            ctx.lineTo(trip.from.x, trip.from.y);
            ctx.lineTo(trip.to.x, trip.to.y);
            ctx.stroke();
        }

        // Write to file
        var out = fs.createWriteStream(filename);
        var stream = canvas.pngStream();
        stream.on('data', function(chunk){
            out.write(chunk);
        });

        stream.on('end', function(){
            console.log('saved png');
        });
    }
}

module.exports = RegionVisualizer;
