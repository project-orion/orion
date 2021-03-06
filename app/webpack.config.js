var webpack = require('webpack'),
    path = require('path'),
    htmlPlugin = require('html-webpack-plugin'),
    extractTextWebpackPlugin = require('extract-text-webpack-plugin'),
    UglifyJSPlugin = require('uglifyjs-webpack-plugin'),
    BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin


var SRC_DIR = path.join(__dirname, './src')
var DIST_DIR = path.join(__dirname, './dist')

console.log('Node environment: ' + process.env.NODE_ENV)

module.exports = {
    target: 'web',
    context: SRC_DIR,
    entry: {
        main: './application/main.tsx',
        bundleLibraries: [
            '@blueprintjs/core',
            'csv-parse',
            'd3',
            'lodash',
            'moment',
            'react',
            'react-dom',
            'react-measure',
            'react-redux',
            'react-router',
            'react-router-dom',
            'redux',
            'redux-logger',
            'slug',
        ]
    },
    devtool: 'source-map',
    output: {
        path: DIST_DIR,
        publicPath: '/',
        filename: 'app.bundle.js',
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.json']
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                use: [
                    'react-hot-loader',
                    'awesome-typescript-loader'
                ],
            },
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ],
            }
        ],
    },
    plugins: (
        (process.env.NODE_ENV == 'production') ?
            [new UglifyJSPlugin()] :
            [
                // Use when bundle analysis is needed:
                // new BundleAnalyzerPlugin()
            ]
        ).concat([
        // Plugin to compile libraries speficied in the entry
        // into a loadable bundle file.
        new webpack.IgnorePlugin(/unicode\/category\/So/, /node_modules/),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'bundleLibraries',
            filename: 'libraries.bundle.js',
            minChunks: Infinity
        }),
        new htmlPlugin({
            template: 'index.html'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        }),
    ]),
    devServer: {
        historyApiFallback: true
    },
    node: {
        // workaround for webpack-dev-server issue
        // https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
        fs: 'empty',
        net: 'empty'
    }
};
