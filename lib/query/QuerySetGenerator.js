'use strict';

const fs = require('fs');
const Config = require('../util/Config.js');
const Time = require('../util/Time.js');
const Util = require('../util/Util.js');

/* A QuerySetGenerator generates a jsonstream of user routes at certain times. */
class QuerySetGenerator {
    constructor(region, config) {
        this.region = region;
        this.querySet = [];

        var param_scope = "queryset:";
        this.param_seed = Config.value(config, 'seed', 1); // Random seed
        this.param_start_stop_choice_power = Config.value(config, param_scope + 'start_stop_choice_power', 4); // Higher values means higher chance on larger stations when selecting starting stations
        this.param_query_count = Config.value(config, param_scope + 'query_count', 100); // The number of queries that should be generated
        this.param_time_initial = Config.value(config, param_scope + 'time_initial', 0); // The initial timestamp
        this.param_time_final = Config.value(config, param_scope + 'time_final', 24 * 3600000 * 31); // The final timestamp
        this.param_max_time_before_departure = Config.value(config, param_scope + 'max_time_before_departure', 3600000); // The maximum time in ms that a query for a certain departure time must be queried
        this.param_hourly_weekday_distribution = Config.value(config, param_scope + 'hourly_weekday_distribution', Time.DEFAULT_HOURLY_WEEKDAY_DISTRIBUTION);
        this.param_hourly_weekend_distribution = Config.value(config, param_scope + 'hourly_weekend_distribution', Time.DEFAULT_HOURLY_WEEKEND_DISTRIBUTION);
        this.pool_week_hours = Time.createTimeChoicePool(this.param_hourly_weekday_distribution);
        this.pool_weekend_hours = Time.createTimeChoicePool(this.param_hourly_weekend_distribution);
    }

    random() {
        var x = Math.sin(this.param_seed++) * 10000;
        return x - Math.floor(x);
    }

    randomZipf(power) {
        return 1 - Math.log10(this.random() * 9 + 1);
    }

    getRandomClosure() {
        return () => this.random();
    }

    getRandomInitialTime() {
        return Time.getRandomInitialTime(this.getRandomClosure(), this.pool_week_hours, this.pool_weekend_hours, this.param_time_initial, this.param_time_final);
    }

    addQuery(departureStop, arrivalStop, departureTime, timeOffset){
        this.querySet.push({ departureStop: Util.stopToNamedId(departureStop), arrivalStop: Util.stopToNamedId(arrivalStop), departureTime: departureTime, T: timeOffset });
    }

    generate(path) {
        var stations = this.region.getStations().sort((a, b) => b.value - a.value);

        while (this.querySet.length < this.param_query_count) {
            var departureStop = Util.getRandomElementWeightedBySize(this.getRandomClosure(), stations, this.param_start_stop_choice_power);
            var arrivalStop = departureStop;
            while (arrivalStop == departureStop) {
                arrivalStop = Util.getRandomElementWeightedBySize(this.getRandomClosure(), stations, this.param_start_stop_choice_power);
            }

            var departureTime = this.getRandomInitialTime();

            var timeOffset = (this.randomZipf(this.param_time_choice_power) * this.param_max_time_before_departure) / 1000;
            this.addQuery(departureStop, arrivalStop, departureTime, timeOffset);
        }

        var os = fs.createWriteStream(path);
        this.querySet.forEach(query => {
            os.write(JSON.stringify(query) + "\n");
        });
        os.end();
    }

    getQuerySet() {
        return this.querySet;
    }
}

module.exports = QuerySetGenerator;