const path = require('path');
require('babel-polyfill');
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const CleanObsoleteChunks = require( 'webpack-clean-obsolete-chunks' );
const FixStyleOnlyEntriesPlugin = require( 'webpack-fix-style-only-entries' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const OptimizeCSSAssetsPlugin = require( 'optimize-css-assets-webpack-plugin' );

module.exports = {
    mode: 'production',
    devtool: 'source-map',
    entry: {
        'buttons': ['babel-polyfill', './src/frontend/buttons.js'],
        'style':  './src/sass/style.scss'
    },
    output: {
        path:     path.resolve( __dirname, 'public' ),
        filename: 'js/[name].min.js',
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use:  [
                MiniCssExtractPlugin.loader,
                {
                    loader:  'css-loader',
                    options: {
                        url:       false,
                        sourceMap: true,
                    },
                },
                {
                    loader:  'postcss-loader',
                    options: { sourceMap: true },
                },
                {
                    loader:  'sass-loader',
                    options: { sourceMap: true },
                },
            ],
        },
        {
            test:    /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use:     {
                loader:  'babel-loader',
                options: {
                    presets: [ '@babel/preset-env' ]
                }
            }
        }]
    },
    plugins: [
        new CopyWebpackPlugin([{
            from: './src/img',
            to: 'img'
        }], {}),
        new FixStyleOnlyEntriesPlugin(),
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: [
                '!js/*.min.js',
                '!css/*.min.css',
                '!img/*',
            ],
        }),
        new CleanObsoleteChunks(),
        new MiniCssExtractPlugin({
            filename: 'css/[name].min.css'
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
            }),
            new OptimizeCSSAssetsPlugin({
                cssProcessorOptions: {
                    map: {
                        inline: false
                    }
                }
            }),
        ]
    }
}