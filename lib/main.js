/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var cli = require('caf_iot_cli');
var cafDr = require('caf_ardrone');


exports.start = function(config) {

    var counter= 7000;
    config = config || {};
    config.ip = config.ip || '127.0.0.1';
    config.interval = 1000;
    var cl = cafDr.client(config);

    var tAdj;

    var mainF = {
        config: config,
        readSensorsHook: function(mapOut, cb) {
            counter = counter + 1;
            mapOut.counter = counter;
            mapOut.navData = cl.navData.all();
            cl.navData.reset();
            mapOut.gpsData = cl.gpsData.all();
            cl.gpsData.reset();
            cb(null);
        },

        /**
         * 'command' is  a string with a data structure encoded in JSON with
         * the following type:
         *
         *  {when: number, bundle: string}>
         *
         * 'when' is UTC time in msec since 1/1/1970,
         * 'bundle' is a JSON-serialized collection of drone commands
         *
         *
         */
        executeCommandHook: function(command, mapIn, mapOut, cb) {
            console.log("Got command: " + command + " with mapIn: " +
                        JSON.stringify(mapIn));
            var commandParsed = JSON.parse(command);
            var when = commandParsed.when;
            when = when + tAdj.getOffset();
            var b1 = cafDr.parseBundle(commandParsed.bundle);
            b1.schedule(cl, when);
            cb(null, "Done " + command);
        },
        mainHook: function(mapIn, mapOut, cb) {
            if (mapIn.config) {
                cl.config.update(mapIn.config);
            }
            console.log("Iter:" + counter.toString() + " Config:" +
                        mapIn.config);
            console.log("Offset:" + tAdj.getOffset());
            cb(null);
        },
        cb: function(err, data) {
            if (err) {
                console.log("Dying!!!: error:" + JSON.stringify(err));
            } else {
                 console.log("Got " + JSON.stringify(data));
            }
        }
    };

    var main = new cli.MainLoop(mainF);
    tAdj = main.getTimeAdjuster();
    main.start();
    return main;
};
