'use strict';

const fs = require('fs');
const Canvas = require('canvas');

const Point = require('./../util/Point.js');

// Source: https://github.com/sunng87/heatcanvas/blob/master/heatcanvas.js
class RegionVisualizer {
    constructor(region, edges, routes, connections, debugpoints, scale, heatmap) {
        this.region = region;
        this.edges = edges;
        this.routes = routes;
        this.connections = connections;
        this.debugpoints = debugpoints;
        this.scale = scale || 3.0;
        this.heatmap = heatmap;
    }

    random(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
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
                var value = this.region.getRaw(x, y);
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

        if (this.heatmap) {
            var maxValue = 0;
            var totalValue = 0;
            var cnt = 0;
            for (var x = 0; x < size.x; x++) {
                for (var y = 0; y < size.y; y++) {
                    var value = this.region.getSize(x, y);
                    if (value) {
                        cnt++;
                        maxValue = Math.max(value, maxValue);
                        totalValue += value;
                    }
                }
            }
            var avgValue = totalValue / cnt;

            for (var x = 0; x < size.x; x++) {
                for (var y = 0; y < size.y; y++) {
                    var value = this.region.getSize(x, y);
                    if (value) {
                        var pixelColorIndex = y * this.scale * size.x * this.scale * 4 + x * this.scale * 4;

                        var color = this.hsla2rgba(this.value2Color(value, maxValue, avgValue));
                        canvasData.data[pixelColorIndex] = color[0]; // r
                        canvasData.data[pixelColorIndex + 1] = color[1]; // g
                        canvasData.data[pixelColorIndex + 2] = color[2]; // b
                        canvasData.data[pixelColorIndex + 3] = color[3]; // a
                    }
                }
            }
        }

        if (this.debugpoints) {
            var debugColor = [255, 0, 0, 255];
            for (var i = 0; i < this.debugpoints.length; i++) {
                var point = this.debugpoints[i];
                for (var j = 0; j < this.scale; j++) {
                    for (var k = 0; k < this.scale; k++) {
                        var pixelColorIndex = (point.y + k) * this.scale * size.x * this.scale * 4 + (point.x + j) * this.scale * 4;

                        var color = debugColor;
                        canvasData.data[pixelColorIndex] = color[0]; // r
                        canvasData.data[pixelColorIndex + 1] = color[1]; // g
                        canvasData.data[pixelColorIndex + 2] = color[2]; // b
                        canvasData.data[pixelColorIndex + 3] = color[3]; // a
                    }
                }
            }
        }

        ctx.putImageData(canvasData, 0, 0);

        if (this.edges && !this.routes) {
            for (var i = 0; i < this.edges.length; i++) {
                var edge = this.edges[i];
                ctx.strokeStyle = 'rgba(150,150,255,255)';
                ctx.beginPath();
                ctx.lineTo(edge.from.x * this.scale, edge.from.y * this.scale);
                ctx.lineTo(edge.to.x * this.scale, edge.to.y * this.scale);
                ctx.stroke();
            }
        }
        if (this.routes) {
            for (var i = 0; i < this.routes.length; i++) {
                var route = this.routes[i];
                var r = Math.floor(this.random(i) * 255);
                var g = Math.floor(this.random(i + 1) * 255);
                var b = Math.floor(this.random(i + 2) * 255);
                ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',100)';
                route.edges.forEach(edge => {
                    ctx.beginPath();
                    ctx.lineTo(edge.from.x * this.scale, edge.from.y * this.scale);
                    ctx.lineTo(edge.to.x * this.scale, edge.to.y * this.scale);
                    ctx.stroke();
                });
            }
        }
        if (this.connections) {
            for (var i = 0; i < this.connections.length; i++) {
                var connection = this.connections[i];
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.01)';
                var trip = connection.trip;
                ctx.beginPath();
                ctx.lineTo(trip.from.x * this.scale, trip.from.y * this.scale);
                ctx.lineTo(trip.to.x * this.scale, trip.to.y * this.scale);
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
            //console.log('saved png');
        });
    }

    // function copied from:
    // http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    hsla2rgba(data){
        var [h, s, l, a] = data;
        var r, g, b;

        if(s == 0){
            r = g = b = l;
        }else{
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = this.hue2rgb(p, q, h + 1/3);
            g = this.hue2rgb(p, q, h);
            b = this.hue2rgb(p, q, h - 1/3);
        }

        return [r * 255, g * 255, b * 255, a * 255];
    }

    hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    value2Color(value, maxValue, avgValue){
        var h = 1 - (Math.max(0, value - maxValue));
        var l = 1 - ((value / maxValue) * 0.05 + (Math.max(0, value - avgValue)) * 0.95);
        //var l = (value / maxValue) * 0.5 + (Math.max(0, value - avgValue)) * 0.5;
        var s = 1;
        var a = 1;
        return [h, s, l, a];
    }
}

module.exports = RegionVisualizer;
