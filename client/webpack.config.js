const path = require('node:path');
const {DefinePlugin, NormalModuleReplacementPlugin} = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');
const MergeJsonWebpackPlugin = require('merge-jsons-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const project = require('./aurelia.json');
const {AureliaPlugin} = require('aurelia-webpack-plugin');
const {IgnorePlugin} = require('webpack');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

// config helpers:
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) => condition ? ensureArray(config) : ensureArray(negativeConfig);

const cssRules = [
    {
        loader: 'css-loader'
    },
    {
        loader: 'postcss-loader',
        options: {
            postcssOptions: {
                plugins: [
                    'autoprefixer',
                    'cssnano'
                ]
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


module.exports = ({production, android}, {analyze, hmr, port, host}) => {
    const title = project.name;
    const outDir = path.resolve(__dirname, project.platform.output);
    const srcDir = path.resolve(__dirname, 'src');
    const appTarget = android ? 'android' : 'web';
    const isProduction = production || android;
    const environment = android ? 'android' : (production ? 'production' : 'development');
    return ({
        resolve: {
            extensions: ['.js'],
            modules: [srcDir, 'node_modules'],
            alias: {
                'aurelia-binding': path.resolve(__dirname, 'node_modules/aurelia-binding'),
                'aurelia-dependency-injection': path.resolve(__dirname, 'node_modules/aurelia-dependency-injection'),
                punycode: path.resolve(__dirname, 'node_modules/punycode')
            },
            fallback: {
                'path': false
            }
        },
        entry: {
            app: ['aurelia-bootstrapper']
        },
        mode: isProduction ? 'none' : 'development',
        output: {
            path: outDir,
            publicPath: isProduction ? './' : '/',
            filename: isProduction ? '[name].[chunkhash].bundle.js' : '[name].[fullhash].bundle.js',
            sourceMapFilename: isProduction ? '[name].[chunkhash].bundle.map' : '[name].[fullhash].bundle.map',
            chunkFilename: isProduction ? '[name].[chunkhash].chunk.js' : '[name].[fullhash].chunk.js',
            clean: true
        },
        optimization: {
            runtimeChunk: true,
            minimize: !!isProduction,
            minimizer: isProduction ? [new TerserPlugin()] : []
        },
        performance: {hints: false},
        devServer: {
            static: {
                directory: outDir,
                publicPath: isProduction ? './' : '/'
            },
            historyApiFallback: true,
            setupExitSignals: true,
            open: project.platform.open,
            hot: hmr || project.platform.hmr,
            port: port || project.platform.port,
            host: host || project.platform.host,
            server: !isProduction && project.platform.https ? {type: 'https'} : false
        },
        devtool: isProduction ? undefined : 'cheap-module-source-map',
        module: {
            rules: [
                {
                    test: /\.css$/,
                    issuer: {not: /\.html$/},
                    use: ['style-loader', ...cssRules]
                },
                {
                    test: /\.css$/,
                    issuer: /\.html$/,
                    use: cssRules
                },
                {
                    test: /\.scss$/,
                    use: ['style-loader', ...cssRules, ...sassRules],
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
                    options: project.build.options.coverage ? {sourceMap: 'inline', plugins: ['istanbul']} : {}
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
                    test: /\.(svg)$/,
                    include: path.resolve(__dirname, './node_modules/bootstrap-icons/icons'),
                    type: 'asset/resource',
                    generator: {filename: 'assets/icons/[name][ext]'}
                },
                {
                    test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    type: 'asset/resource'
                },
                {
                    test: /environment\.json$/i, use: [
                        {loader: 'app-settings-loader', options: {env: environment}}
                    ]
                }
            ]
        },
        plugins: [
            new DuplicatePackageCheckerPlugin(),
            new AureliaPlugin(),
            new DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
            }),
            new NormalModuleReplacementPlugin(
                /(.*)-APP_TARGET(\.*)/,
                resource => {
                    resource.request = resource.request.replace(
                        /-APP_TARGET/,
                        `-${appTarget}`
                    );
                }
            ),
            new HtmlWebpackPlugin({
                template: 'index.ejs',
                minify: isProduction ? {
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
                metadata: {title, baseUrl: isProduction ? './' : '/'}
            }),
            new IgnorePlugin({
                resourceRegExp: /^\.\/locale$/,
                contextRegExp: /moment$/
            }),
            new MiniCssExtractPlugin({
                filename: isProduction ? 'css/[name].[contenthash].bundle.css' : 'css/[name].[hash].bundle.css',
                chunkFilename: isProduction ? 'css/[name].[contenthash].chunk.css' : 'css/[name].[hash].chunk.css'
            }),
            new MergeJsonWebpackPlugin({
                output: {
                    groupBy: [
                        {
                            pattern: '{./node_modules/library-aurelia/locales/de/*.json,./locales/de/*.json}',
                            fileName: './locales/de/translation.json'
                        },
                        {
                            pattern: '{./node_modules/library-aurelia/locales/en/*.json,./locales/en/*.json}',
                            fileName: './locales/en/translation.json'
                        }
                    ]
                }
            }),
            new CopyWebpackPlugin({
                patterns: [{
                    from: 'static',
                    to: outDir,
                    globOptions: {ignore: ['.*']}
                }]
            }),
            ...when(analyze, new BundleAnalyzerPlugin()),
            new CleanWebpackPlugin()
        ]
    });
}
