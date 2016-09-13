'use strict';

const fs = require('fs');
const Canvas = require('canvas');

const Point = require('./../util/Point.js');

// Source: https://github.com/sunng87/heatcanvas/blob/master/heatcanvas.js
class RegionVisualizer {
    constructor(region, edges, debugpoints, scale) {
        this.region = region;
        this.edges = edges;
        this.debugpoints = debugpoints;
        if (!scale) this.scale = 5.0;
    }

    render(filename) {
        if (!filename) filename = 'edges.png';
        var size = this.region.max;
        var canvas = new Canvas(size.x * this.scale, size.y * this.scale);
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size.x * this.scale, size.y * this.scale);

        var defaultColor = this.bgcolor || [255, 255, 255, 255];
        var canvasData = ctx.createImageData(size.x * this.scale, size.y * this.scale);
        for (var i = 0; i < canvasData.data.length; i += 4){
            canvasData.data[i  ] = defaultColor[0]; // r
            canvasData.data[i+1] = defaultColor[1];
            canvasData.data[i+2] = defaultColor[2];
            canvasData.data[i+3] = defaultColor[3];
        }

        var stopColor = [0, 50, 0, 255];
        for (var x = 0; x < size.x; x++) {
            for (var y = 0; y < size.y; y++) {
                var value = this.region._data[x][y];
                if (value && value.station) {
                    // MDC ImageData:
                    // data = [r1, g1, b1, a1, r2, g2, b2, a2 ...]
                    var pixelColorIndex = y * this.scale * size.x * this.scale * 4 + x * this.scale * 4;

                    var color = stopColor;
                    canvasData.data[pixelColorIndex] = color[0]; // r
                    canvasData.data[pixelColorIndex + 1] = color[1]; // g
                    canvasData.data[pixelColorIndex + 2] = color[2]; // b
                    canvasData.data[pixelColorIndex + 3] = color[3]; // a
                }
            }
        }

        if (this.debugpoints) {
            var debugColor = [255, 0, 0, 255];
            for (var i = 0; i < this.debugpoints.length; i++) {
                var point = this.debugpoints[i];
                var pixelColorIndex = point.y * this.scale * size.x * this.scale * 4 + point.x * this.scale * 4;

                var color = debugColor;
                canvasData.data[pixelColorIndex] = color[0]; // r
                canvasData.data[pixelColorIndex + 1] = color[1]; // g
                canvasData.data[pixelColorIndex + 2] = color[2]; // b
                canvasData.data[pixelColorIndex + 3] = color[3]; // a
            }
        }

        ctx.putImageData(canvasData, 0, 0);

        if (this.edges) {
            for (var i = 0; i < this.edges.length; i++) {
                var edge = this.edges[i];
                ctx.strokeStyle = 'rgba(150,150,255,255)';
                ctx.beginPath();
                ctx.lineTo(edge.from.x * this.scale, edge.from.y * this.scale);
                ctx.lineTo(edge.to.x * this.scale, edge.to.y * this.scale);
                ctx.stroke();
            }
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
