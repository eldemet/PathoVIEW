const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const project = require('./aurelia_project/aurelia.json');
const {AureliaPlugin, ModuleDependenciesPlugin} = require('aurelia-webpack-plugin');
const {IgnorePlugin} = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');

// config helpers:
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) => condition ? ensureArray(config) : ensureArray(negativeConfig);

// primary config:
const title = project.name;
const outDir = path.resolve(__dirname, project.platform.output);
const srcDir = path.resolve(__dirname, 'src');

const cssRules = [
    {
        loader: 'css-loader'
    },
    {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: ['autoprefixer']
            }
        }
    }
];

const sassRules = [
    {
        loader: 'sass-loader',
        options: {
            includePaths: ['node_modules']
        }
    }
];

module.exports = ({production, server, extractCss, coverage, analyze, karma} = {}) => ({
    resolve: {
        extensions: ['.js'],
        modules: [srcDir, 'node_modules'],
        alias: {
            'aurelia-binding': path.resolve(__dirname, 'node_modules/aurelia-binding'),
            'aurelia-dependency-injection': path.resolve(__dirname, 'node_modules/aurelia-dependency-injection')
        }
    },
    entry: {
        app: ['aurelia-bootstrapper']
    },
    mode: production ? 'none' : 'development',
    output: {
        path: outDir,
        publicPath: production ? './' : '/',
        filename: production ? '[name].[chunkhash].bundle.js' : '[name].[fullhash].bundle.js',
        sourceMapFilename: production ? '[name].[chunkhash].bundle.map' : '[name].[fullhash].bundle.map',
        chunkFilename: production ? '[name].[chunkhash].chunk.js' : '[name].[fullhash].chunk.js'
    },
    optimization: {
        minimizer: [
            new CssMinimizerPlugin()
        ],
        minimize: production,
        runtimeChunk: true
    },
    performance: {hints: false},
    devServer: {
        static: {
            directory: outDir,
            publicPath: production ? './' : '/'
        },
        historyApiFallback: true,
        setupExitSignals: true
    },
    devtool: production ? undefined : 'eval-cheap-module-source-map',
    module: {
        rules: [
            {
                test: /\.css$/,
                issuer: {not: /\.html$/},
                use: extractCss ? [MiniCssExtractPlugin.loader, 'css-loader'] : ['style-loader', ...cssRules]
            },
            {
                test: /\.css$/,
                issuer: /\.html$/,
                use: cssRules
            },
            {
                test: /\.scss$/,
                use: extractCss ? [MiniCssExtractPlugin.loader, ...cssRules, ...sassRules] : ['style-loader', ...cssRules, ...sassRules],
                issuer: /\.[tj]s$/
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'css-loader',
                        options: {esModule: false}
                    },
                    'sass-loader'
                ],
                issuer: /\.html$/
            },
            {
                test: /\.html$/, loader: 'html-loader'
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules(?!(\/|\\)library-aurelia)/,
                options: coverage ? {sourceMap: 'inline', plugins: ['istanbul']} : {}
            },
            {
                test: /\.(png|gif|jpg|cur)$/,
                issuer: {not: /\.js$/},
                type: 'asset'
            },
            {
                test: /\.(png|gif|jpg|cur)$/,
                issuer: /\.js$/,
                type: 'asset/resource',
                generator: {filename: 'assets/[name][ext]'}
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                include: path.resolve(__dirname, './node_modules/bootstrap-icons/font/fonts'),
                type: 'asset/resource',
                generator: {filename: 'webfonts/[name][ext]'}
            },
            {
                test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        ...when(!karma, new DuplicatePackageCheckerPlugin()),
        new AureliaPlugin(),
        new ModuleDependenciesPlugin({
            'aurelia-testing': ['./compile-spy', './view-spy']
        }),
        new HtmlWebpackPlugin({
            template: 'index.ejs',
            minify: production ? {
                removeComments: true,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                minifyCSS: true,
                minifyJS: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                ignoreCustomFragments: [/\${.*?}/g]
            } : undefined,
            metadata: {title, server, baseUrl: production ? './' : '/'}
        }),
        new IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/
        }),
        ...when(extractCss, new MiniCssExtractPlugin({
            filename: production ? 'css/[name].[contenthash].bundle.css' : 'css/[name].[hash].bundle.css',
            chunkFilename: production ? 'css/[name].[contenthash].chunk.css' : 'css/[name].[hash].chunk.css'
        })),
        ...when(production || server, new CopyWebpackPlugin({
            patterns: [{
                from: 'static',
                to: outDir,
                globOptions: {ignore: ['.*']}
            }]
        })),
        ...when(analyze, new BundleAnalyzerPlugin())
    ]
});
