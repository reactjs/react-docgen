const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJsPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const sourceDirectory = path.resolve(__dirname, './src');
const targetDirectory = path.resolve(__dirname, './dist');

const isDev = process.env.NODE_ENV !== 'production';

const plugins = [
  new HtmlWebpackPlugin({
    filename: 'index.html',
    inject: true,
    template: path.resolve(__dirname, 'src/index.html'),
    minify: {
      collapseWhitespace: !isDev,
      removeComments: !isDev,
      removeRedundantAttributes: !isDev,
    },
  }),
  new MiniCssExtractPlugin({
    filename: '[name]-[contenthash].css',
    chunkFilename: '[name]-[contenthash].css',
  }),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
    'process.env.BABEL_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
    'process.env.NODE_DEBUG': 'false',
  }),
  new webpack.ProvidePlugin({
    process: 'process',
  }),
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
  }),
];

module.exports = {
  mode: isDev ? 'development' : 'production',
  context: sourceDirectory,
  entry: {
    app: './index.js',
  },
  optimization: {
    minimizer: [new TerserJsPlugin(), new OptimizeCSSAssetsPlugin({})],
  },
  output: {
    path: targetDirectory,
    chunkFilename: 'chunk-[chunkhash].js',
    filename: '[name]-[chunkhash].js',
    hashDigestLength: 8,
  },
  devServer: {
    contentBase: sourceDirectory,
    port: 8000,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.(less|css)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
        sideEffects: true,
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
    ],
  },
  resolve: {
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      fs: false,
      module: false,
      net: false,
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
    },
    alias: {
      'react-docgen': path.resolve(__dirname, '../src/main'),
    },
  },
  plugins,
};
