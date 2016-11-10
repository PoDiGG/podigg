'use strict';

const Util = require('./Util');
const _ = require('lodash');

class Time {
    static sortHours(distr) {
        return distr
          .map((val, i) => {
              return { hour: i, val: val };
          })
          .sort((a, b) => b.val - a.val)
          .map((val, i) => {
              return val.hour;
          });
    }

    static createTimeChoicePool(time_distribution, factor) {
        if (!factor) factor = 100;
        var pool = [];
        time_distribution.forEach((chance, hour) => {
            var amount = Math.ceil(chance * factor);
            for (var i = 0; i < amount; i++) {
                pool.push(hour);
            }
        });
        return pool;
    }

    static getRandomInitialTime(random, pool_week_hours, pool_weekend_hours, time_initial, time_final) {
        // Get random day
        var timeRange = time_final - time_initial;
        var time = time_initial + Math.floor(random() * timeRange);
        var timeDay = time - (time % (3600000 * 24));

        // Select weekday or weekend distr
        var day = new Date(time).getDay();
        var isWeekend = (day == 6) || (day == 0);
        var pool = isWeekend ? pool_weekend_hours : pool_week_hours;

        // Get random hour of day
        var hour = pool[Math.floor(random() * pool.length)] * 3600000;

        // Return day + hour + random offset in the hour
        return timeDay + hour + Math.floor(random() * 3600000);
    }
}

Time.DEFAULT_HOURLY_WEEKDAY_DISTRIBUTION = [
    0.05,
    0.01,
    0.01,
    0.48,
    2.46,
    5.64,
    7.13,
    6.23,
    5.44,
    5.43,
    5.41,
    5.49,
    5.42,
    5.41,
    5.57,
    6.70,
    6.96,
    6.21,
    5.40,
    4.95,
    4.33,
    3.31,
    1.56,
    0.42
];
Time.DEFAULT_HOURLY_WEEKEND_DISTRIBUTION = [
    0.09,
    0.01,
    0.01,
    0.08,
    0.98,
    3.56,
    5.23,
    5.79,
    5.82,
    5.89,
    5.84,
    5.91,
    5.88,
    5.95,
    5.87,
    5.95,
    5.89,
    5.96,
    5.92,
    5.94,
    5.62,
    4.61,
    2.45,
    0.76
];

module.exports = Time;