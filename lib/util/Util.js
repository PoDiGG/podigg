'use strict';

class Util {
    static getRandomWeightedBySize(random, size, power) {
        // Choose a random value with a larger chance of having a lower index.
        var uniform = random();
        var beta = Math.pow(Math.sin(uniform * Math.PI / 2), power);
        var beta_left = (beta < 0.5) ? 2 * beta : 2 * (1 - beta);
        return Math.floor(beta_left * size);
    }

    static getRandomElementWeightedBySize(random, elements, power) {
        return elements[Util.getRandomWeightedBySize(random, elements.length, power)];
    }

    static stopToNamedId(stop) {
        return "stop_" + stop.x + "_" + stop.y;
    }

    static createChoicePool(distribution_map, factor) {
        if (!factor) factor = 100;
        var pool = [];
        Object.keys(distribution_map).forEach(key => {
            var chance = distribution_map[key];
            var amount = Math.ceil(chance * factor);
            for (var i = 0; i < amount; i++) {
                pool.push(key);
            }
        });
        return pool;
    }
}

Util.DEFAULT_DELAY_REASONS = {
    'http://purl.org/td/transportdisruption#QueuingTraffic': 0.07936507,
    'http://purl.org/td/transportdisruption#SlowTraffic': 0.01587301,

    'http://purl.org/td/transportdisruption#Derailment': 0.00158730,

    'http://purl.org/td/transportdisruption#CollisionWithAnimal': 0.01587301,
    'http://purl.org/td/transportdisruption#CollisionWithPerson': 0.03174602,
    'http://purl.org/td/transportdisruption#HeadOnCollision': 0.00158730,

    'http://purl.org/td/transportdisruption#CivilEmergency': 0.07936507,
    'http://purl.org/td/transportdisruption#PoliceInvestigation': 0.01587301,

    'http://purl.org/td/transportdisruption#IllVehicleOccupants': 0.04761904,
    'http://purl.org/td/transportdisruption#BombAlert': 0.0079365,
    'http://purl.org/td/transportdisruption#Demonstration': 0.0047619,
    'http://purl.org/td/transportdisruption#AltercationOfVehicleOccupants': 0.01587301,
    'http://purl.org/td/transportdisruption#Strike': 0.0047619,

    'http://purl.org/td/transportdisruption#StrongWinds': 0.02857142,
    'http://purl.org/td/transportdisruption#ExtremeCold': 0.01587301,
    'http://purl.org/td/transportdisruption#BadWeather': 0.03174602,
    'http://purl.org/td/transportdisruption#ExtremeHeat': 0.0079365,
    'http://purl.org/td/transportdisruption#HeavySnowfall': 0.0079365,

    'http://purl.org/td/transportdisruption#FallenTrees': 0.03174602,
    'http://purl.org/td/transportdisruption#Flooding': 0.0047619,
    'http://purl.org/td/transportdisruption#StormDamage': 0.03174602,

    'http://purl.org/td/transportdisruption#FallenPowerCables': 0.03174602,
    'http://purl.org/td/transportdisruption#DamagedTunnel': 0.00158730,

    'http://purl.org/td/transportdisruption#AbnormalLoad': 0.1111111,
    'http://purl.org/td/transportdisruption#BrokenDownTrain': 0.0079365,
    'http://purl.org/td/transportdisruption#DamagedVehicle': 0.04761904,

    'http://purl.org/td/transportdisruption#ConstructionWork': 0.04761904,

    'http://purl.org/td/transportdisruption#MaintenanceWork': 0.04761904,
    'http://purl.org/td/transportdisruption#RepairWork': 0.04761903,
    'http://purl.org/td/transportdisruption#TreeAndVegetationCuttingWork': 0.01587301,

    'http://purl.org/td/transportdisruption#TrafficSignalsFailure': 0.15873015,
};

module.exports = Util;
