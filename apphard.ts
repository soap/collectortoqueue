/**
 * Created by nicolasbahout on 22/05/15.
 */

// worker.js

var _ = require('lodash'),
    kue = require('kue'),
    q = require('q'),
    sails = require('sails');
var configData;

module.exports = function (conf) {

    //console.log(configData);
    console.log('start');

    module.exports.myConf = conf;

    process.chdir(__dirname);

// Ensure a "sails" can be located:
    (function () {
        var sails;
        try {
            sails = require('sails');
        } catch (e) {
            console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
            console.error('To do that, run `npm install sails`');
            console.error('');
            console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
            console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
            console.error('but if it doesn\'t, the app will run with the global sails instead!');
            return;
        }


        // Try to get `rc` dependency
        var rc;
        try {
            rc = require('rc');
        } catch (e0) {
            try {
                rc = require('sails/node_modules/rc');
            } catch (e1) {
                console.error('Could not find dependency: `rc`.');
                console.error('Your `.sailsrc` file(s) will be ignored.');
                console.error('To resolve this, run:');
                console.error('npm install rc --save');
                rc = function () {
                    return {};
                };
            }
        }


        sails.load({
            hooks: {
                blueprints: false,
                controllers: false,
                cors: false,
                csrf: false,
                grunt: false,
                //http: false,
                i18n: false,
                logger: false,
                policies: false,
                pubsub: false,
                //pubsub: require('pubsub-emitter'),
                request: false,
                responses: false,
                session: false,
                sockets: false,
                views: false
            }
        }, function (err, app) {

            sails.log.info("Starting kue");
            var kue_engine = sails.config.kue;

            //register kue.
            sails.log.info("Registering jobs");
            var jobs = require('include-all')({
                // dirname: __dirname + '/task',
                dirname: __dirname + '/..' + conf.directory,
                filter: /(.+)\.js$/,
                excludeDirs: /^\.(git|svn)$/,
                optional: true
            });




            _.forEach(jobs, function (job, name) {
                console.log(job);
                sails.log.info("Registering kue handler: " + name);
                kue_engine.process(name, job);
            });

            kue_engine.on('job complete', function (id) {
                sails.log.info("Removing completed job: " + id + ' ' + new Date());
                /*kue.Job.get(id, function (err, job) {
                 job.remove();
                 });*/
            });


            //sails.config.paths.models = '/Users/nicolasbahout/Sites/cl-task/models/';



            process.once('SIGTERM', function (sig) {
                kue_engine.shutdown(function (err) {
                    console.log('Kue is shut down.', err || '');
                    process.exit(0);
                }, 5000);
            });

        });
    })();
}
