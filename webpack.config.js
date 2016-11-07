var autoprefixer = require('autoprefixer');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var defaults = require('lodash.defaults');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var gitsha = require('git-bundle-sha');
var path = require('path');
var webpack = require('webpack');

var routes = require('./src/routes.json');
var routesDev = require('./src/routes-dev.json');
var templateConfig = require('./src/template-config.js');

if (process.env.NODE_ENV !== 'production') {
    routes = routes.concat(routesDev);
}

var VersionPlugin = function (options) {
    this.options = options || {};
    return this;
};
VersionPlugin.prototype.apply = function (compiler) {
    var addVersion = function (compilation, versionId, callback) {
        compilation.assets['version.txt'] = {
            source: function () {
                return versionId;
            },
            size: function () {
                return versionId.length;
            }
        };
        callback();
    };
    var plugin = this;
    compiler.plugin('emit', function (compilation, callback) {
        if (process.env.WWW_VERSION) return addVersion(compilation, process.env.WWW_VERSION, callback);
        gitsha(plugin.options, function (err, sha) {
            if (err) return callback(err);
            return addVersion(compilation, sha, callback);
        });
    });
};

// Prepare all entry points
var entry = {
    common: [
        // Vendor
        'raven-js',
        'react',
        'react-dom',
        'react-intl',
        'redux',
        // Init
        './src/init.js'
    ]
};
routes.forEach(function (route) {
    if (!route.redirect) {
        entry[route.name] = './src/views/' + route.view + '.jsx';
    }
});

// Config
module.exports = {
    entry: entry,
    devtool: 'eval',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'js/[name].bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx$/,
                loader: 'babel',
                query: {
                    presets: ['es2015', 'react']
                },
                include: path.resolve(__dirname, 'src')
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.scss$/,
                loader: 'style!css!postcss-loader!sass'
            },
            {
                test: /\.css$/,
                loader: 'style!css!postcss-loader'
            },
            {
                test: /\.(png|jpg|gif|eot|svg|ttf|woff)$/,
                loader: 'url-loader'
            }
        ],
        noParse: /node_modules\/google-libphonenumber\/dist/
    },
    postcss: function () {
        return [autoprefixer({browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']})];
    },
    node: {
        fs: 'empty'
    },
    plugins: [
        new VersionPlugin({length: 5})
    ].concat(routes
        .filter(function (route) {
            return !route.redirect;
        })
        .map(function (route) {
            return new HtmlWebpackPlugin(defaults({}, templateConfig, {
                title: route.title,
                filename: route.name + '.html',
                route: route
            }));
        })
    ).concat([
        new CopyWebpackPlugin([
            {from: 'static'},
            {from: 'intl', to: 'js'}
        ]),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"' + (process.env.NODE_ENV || 'development') + '"',
            'process.env.SENTRY_DSN': '"' + (process.env.SENTRY_DSN || '') + '"',
            'process.env.API_HOST': '"' + (process.env.API_HOST || 'https://api.scratch.mit.edu') + '"',
            'process.env.SMARTY_STREETS_API_KEY': '"' + (process.env.SMARTY_STREETS_API_KEY || '') + '"',
            'process.env.SCRATCH_ENV': '"' + (process.env.SCRATCH_ENV || 'development') + '"'
        }),
        new webpack.optimize.CommonsChunkPlugin('common', 'js/common.bundle.js'),
        new webpack.optimize.OccurenceOrderPlugin()
    ])
};
