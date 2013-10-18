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
    config.interval = config.interval || 1000;
    var cl = cafDr.client(config);
    var tAdj;
    var pendingBundles = [];

    var mainF = {
        config: config,
        readSensorsHook: function(mapOut, cb) {
            counter = counter + 1;
            mapOut.counter = counter;
            mapOut.navData = cl.navData.all();
            cl.navData.reset();
            mapOut.gpsData = cl.gpsData.all();
            cl.gpsData.reset();
            if (cl.wifiData) {
                mapOut.wifiData = cl.wifiData.all();
                cl.wifiData.reset();
            }
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
            var b1 = cafDr.parseBundle(commandParsed.bundle);
            /*
             * cleanupF is called just before starting to execute this bundle.
             *
             * The purpose is to ensure that when commands from this bundle
             * are executed, they are not interleaved with commands of
             *  previous bundles.
             *
             * We use this behavior to guarantee safety when we lose
             * connectivity. The last command of a bundle is always a
             * recovery action. If the next bundle arrives
             * before triggering that action, it will disable the
             * emergency action and install a new one for sometime in the
             * future.  By pipelining these bundles we ensure that as
             * long as bundles reach the drone timely, we never need to
             * stop the drone.
             *
             * The delay of the recovery action is set based on a
             * virtual bounding box that the drone should not
             * cross. Given the size of the box (to avoid collitions)
             * and the previous set of commands, we can estimate the
             * time it would take the drone to cross that box.
             *
             * Also, we sometimes provide a second recovery command
             * much further into the future. The idea is that this
             * last recovery action would be permanent, for example,
             * land or come back to
             * base, as opposed to the previous recovery action that
             * just stops the drone in mid-air hoping to reconnect soon.
             *
             */
            var cleanupF = function() {
                pendingBundles.forEach(function(b) { b.abort(); });
                pendingBundles = [b1];
            };
            b1.schedule(cl, when, cleanupF);
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
    cl.time.setAdjuster(tAdj);
    main.start();
    return main;
};
