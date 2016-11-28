var async = require('async');
var defaults = require('lodash.defaults');
var glob = require('glob');
var path = require('path');

var routeJson = require('../src/routes.json');

const FASTLY_SERVICE_ID = process.env.FASTLY_SERVICE_ID || '';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

const PASS_REQUEST_CONDITION_NAME = 'Pass';
const NOT_PASS_REQUEST_CONDITION_NAME = '!(Pass)';
const PASS_CACHE_CONDITION_NAME = 'Cache Pass';
const BUCKET_NAME_HEADER_NAME = 'Bucket name';

var fastly = require('./lib/fastly-extended')(process.env.FASTLY_API_KEY, FASTLY_SERVICE_ID);

var extraAppRoutes = [
    // Homepage with querystring.
    // TODO: Should this be added for every route?
    '/\\?',
    // View html
    '/[^\/]*\.html$' // eslint-disable-line no-useless-escape
];

/*
 * Given the relative path to the static directory, return an array of
 * patterns matching the files and directories there.
 */
var getStaticPaths = function (pathToStatic) {
    var staticPaths = glob.sync(path.resolve(__dirname, pathToStatic));
    return staticPaths.filter(function (pathName) {
        // Exclude view html, resolve everything else in the build
        return path.extname(pathName) !== '.html';
    }).map(function (pathName) {
        // Reduce absolute path to relative paths like '/js'
        var base = path.dirname(path.resolve(__dirname, pathToStatic));
        return pathName.replace(base, '') + (path.extname(pathName) ? '' : '/');
    });
};

/*
 * Given a list of express routes, return a list of patterns to match
 * the express route and a static view file associated with the route
 */
var getViewPaths = function (routes) {
    return routes.reduce(function (paths, route) {
        var searchPath = route.routeAlias || route.pattern;
        if (paths.indexOf(searchPath) === -1) {
            paths.push(searchPath);
        }
        return paths;
    }, []);
};

/*
 * Translate an express-style pattern e.g. /path/:arg/ to a regex
 * all :arguments become .+?
 */
var expressPatternToRegex = function (pattern) {
    return pattern.replace(/(:[^/]+)/gi, '.+?');
};

/*
 * Given a list of patterns for paths, OR all of them together into one
 * string suitable for a Fastly condition
 */
var pathsToCondition = function (paths) {
    return 'req.url~"^(' + paths.reduce(function (conditionString, pattern) {
        return conditionString + (conditionString ? '|' : '') + pattern;
    }, '') + ')"';
};

/*
 * Helper method to NOT a condition statement
 */
var negateConditionStatement = function (statement) {
    return '!(' + statement + ')';
};

/*
 * Combine static paths, routes, and any additional paths to a single
 * fastly condition to match req.url
 */
var getAppRouteCondition = function (pathToStatic, routes, additionalPaths) {
    var staticPaths = getStaticPaths(pathToStatic);
    var viewPaths = getViewPaths(routes);
    var allPaths = [].concat(staticPaths, viewPaths, additionalPaths);
    return pathsToCondition(allPaths);
};

var getConditionNameForRoute = function (route, type) {
    return 'routes/' + route.pattern + ' (' + type + ')';
};

var getHeaderNameForRoute = function (route) {
    if (route.name) return 'rewrites/' + route.name;
    if (route.redirect) return 'redirects/' + route.pattern;
};

var getResponseNameForRoute = function (route) {
    return 'redirects/' + route.pattern;
};

var routes = routeJson.map(function (route) {
    return defaults({}, {pattern: expressPatternToRegex(route.pattern)}, route);
});

async.auto({
    version: function (cb) {
        fastly.getLatestVersion(function (err, response) {
            if (err) return cb(err);
            // Validate latest version before continuing
            if (response.active || response.locked) {
                fastly.cloneVersion(response.number, function (cvErr, cvResponse) {
                    if (cvErr) return cb('Failed to clone latest version: ' + cvErr);
                    cb(null, cvResponse.number);
                });
            } else {
                cb(null, response.number);
            }
        });
    },
    notPassRequestCondition: ['version', function (cb, results) {
        var statement = getAppRouteCondition('../build/*', routes, extraAppRoutes);
        var condition = {
            name: NOT_PASS_REQUEST_CONDITION_NAME,
            statement: statement,
            type: 'REQUEST',
            priority: 10
        };
        fastly.setCondition(results.version, condition, cb);
    }],
    setBucketNameHeader: ['version', 'notPassRequestCondition', function (cb, results) {
        var header = {
            name: BUCKET_NAME_HEADER_NAME,
            action: 'set',
            ignore_if_set: 0,
            type: 'REQUEST',
            dst: 'http.host',
            src: '"' + S3_BUCKET_NAME + '"',
            request_condition: results.notPassRequestCondition.name,
            priority: 1
        };
        fastly.setFastlyHeader(results.version, header, cb);
    }],
    passRequestCondition: ['version', 'notPassRequestCondition', function (cb, results) {
        var condition = {
            name: PASS_REQUEST_CONDITION_NAME,
            statement: negateConditionStatement(results.notPassRequestCondition.statement),
            type: 'REQUEST',
            priority: 10
        };
        fastly.setCondition(results.version, condition, cb);
    }],
    passRequestSettingsCondition: ['version', 'passRequestCondition', function (cb, results) {
        fastly.request(
            'PUT',
            fastly.getFastlyAPIPrefix(FASTLY_SERVICE_ID, results.version) + '/request_settings/Pass',
            {request_condition: results.passRequestCondition.name},
            cb
        );
    }],
    backendCondition: ['version', 'notPassRequestCondition', function (cb, results) {
        fastly.request(
            'PUT',
            fastly.getFastlyAPIPrefix(FASTLY_SERVICE_ID, results.version) + '/backend/s3',
            {request_condition: results.notPassRequestCondition.name},
            cb
        );
    }],
    passCacheCondition: ['version', 'passRequestCondition', function (cb, results) {
        var condition = {
            name: PASS_CACHE_CONDITION_NAME,
            type: 'CACHE',
            statement: results.passRequestCondition.statement,
            priority: results.passRequestCondition.priority
        };
        fastly.setCondition(results.version, condition, cb);
    }],
    passCacheSettingsCondition: ['version', 'passCacheCondition', function (cb, results) {
        fastly.request(
            'PUT',
            fastly.getFastlyAPIPrefix(FASTLY_SERVICE_ID, results.version) + '/cache_settings/Pass',
            {cache_condition: results.passCacheCondition.name},
            cb
        );
    }],
    appRouteRequestConditions: ['version', function (cb, results) {
        var conditions = {};
        async.forEachOf(routes, function (route, id, cb2) {
            var condition = {
                name: getConditionNameForRoute(route, 'request'),
                statement: 'req.url ~ "' + route.pattern + '"',
                type: 'REQUEST',
                // Priority needs to be > 1 to not interact with http->https redirect
                priority: 10 + id
            };
            fastly.setCondition(results.version, condition, function (err, response) {
                if (err) return cb2(err);
                conditions[id] = response;
                cb2(null, response);
            });
        }, function (err) {
            if (err) return cb(err);
            cb(null, conditions);
        });
    }],
    appRouteHeaders: ['version', 'appRouteRequestConditions', function (cb, results) {
        var headers = {};
        async.forEachOf(routes, function (route, id, cb2) {
            if (route.redirect) {
                async.auto({
                    responseCondition: function (cb3) {
                        var condition = {
                            name: getConditionNameForRoute(route, 'response'),
                            statement: 'req.url ~ "' + route.pattern + '"',
                            type: 'RESPONSE',
                            priority: id
                        };
                        fastly.setCondition(results.version, condition, cb3);
                    },
                    responseObject: function (cb3) {
                        var responseObject = {
                            name: getResponseNameForRoute(route),
                            status: 301,
                            response: 'Moved Permanently',
                            request_condition: getConditionNameForRoute(route, 'request')
                        };
                        fastly.setResponseObject(results.version, responseObject, cb3);
                    },
                    redirectHeader: ['responseCondition', function (cb3, redirectResults) {
                        var header = {
                            name: getHeaderNameForRoute(route),
                            action: 'set',
                            ignore_if_set: 0,
                            type: 'RESPONSE',
                            dst: 'http.Location',
                            src: '"' + route.redirect + '"',
                            response_condition: redirectResults.responseCondition.name
                        };
                        fastly.setFastlyHeader(results.version, header, cb3);
                    }]
                }, function (err, redirectResults) {
                    if (err) return cb2(err);
                    headers[id] = redirectResults.redirectHeader;
                    cb2(null, redirectResults);
                });
            } else {
                var header = {
                    name: getHeaderNameForRoute(route, 'request'),
                    action: 'set',
                    ignore_if_set: 0,
                    type: 'REQUEST',
                    dst: 'url',
                    src: '"/' + route.name + '.html"',
                    request_condition: results.appRouteRequestConditions[id].name,
                    priority: 10
                };
                fastly.setFastlyHeader(results.version, header, function (err, response) {
                    if (err) return cb2(err);
                    headers[id] = response;
                    cb2(null, response);
                });
            }
        }, function (err) {
            if (err) return cb(err);
            cb(null, headers);
        });
    }]},
    function (err, results) {
        if (err) throw new Error(err);
        if (process.env.FASTLY_ACTIVATE_CHANGES) {
            fastly.activateVersion(results.version, function (avErr, response) {
                if (avErr) throw new Error(avErr);
                process.stdout.write('Successfully configured and activated version ' + response.number + '\n');
                fastly.purgeAll(FASTLY_SERVICE_ID, function (pErr) {
                    if (pErr) throw new Error(pErr);
                    process.stdout.write('Purged all.\n');
                });
            });
        }
    }
);
