#!/usr/bin/env node
var argv = require('optimist')
    .usage('Usage: $0 --videoPort [video port#] --proxy [string] '
           + '--wifiFIFO [string] (where wifiFIFO is,e.g., /tmp/wifiFIFO'
           + '--url (where url'+
           ' is, e.g.,  http://hellodrone.cafjs.com/iot/<device_id>')
    .demand(['url'])
    .argv;

var client = require('./index.js');
var config = {url: argv.url, proxy: argv.proxy, wifiFIFO: argv.wifiFIFO,
              videoPort:  argv.videoPort};
client.start(config);
