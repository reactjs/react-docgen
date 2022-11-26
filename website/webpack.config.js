'use strict';

const webpack = require('webpack');
const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const sourceDirectory = path.resolve(__dirname, './src');
const targetDirectory = path.resolve(__dirname, './dist');

const isDev = process.env.NODE_ENV !== 'production';

const plugins = [
  new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
    // Remove node: file protocol
    resource.request = resource.request.slice(5);
  }),
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
    minimizer: ['...', new CssMinimizerPlugin()],
  },
  output: {
    path: targetDirectory,
    chunkFilename: 'chunk-[chunkhash].js',
    filename: '[name]-[chunkhash].js',
    hashDigestLength: 8,
  },
  devServer: {
    allowedHosts: 'all',
    static: {
      directory: sourceDirectory,
    },
    port: 8000,
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
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
    extensions: ['.ts', '.js', '.json'],
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      fs: false,
      module: false,
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
    },
    alias: {
      'react-docgen': path.resolve(
        __dirname,
        '../packages/react-docgen/src/main.ts',
      ),
    },
  },
  plugins,
};
