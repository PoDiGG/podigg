'use strict';

class Config {
    static value(config, key, defaultValue) {
        var val = (config || {})[key];
        return !val && val !== 0 ? defaultValue : val;
    }
}

module.exports = Config;