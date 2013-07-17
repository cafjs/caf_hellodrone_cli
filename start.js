#!/usr/bin/env node
var client = require('./index.js');
if (process.argv.length === 3) {
    var config = {url: process.argv[2]};
    client.start(config);
} else if (process.argv.length === 4) {
    var config = {url: process.argv[2], proxy: process.argv[3]};
    client.start(config);
} else {
    console.log('Error: Wrong number of arguments: start.js url '+
                '<optional_proxy> where url is, e.g.:' +
                'http://hellodrone.cafjs.com/iot/<device_id>');
}
