var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

var config = {
  entry: [
    path.join(__dirname, 'src', 'redux-bug-reporter.less'),
    path.join(__dirname, 'src', 'index.js')
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'redux-bug-reporter.js',
    library: 'ReduxBugReporter',
    libraryTarget: 'umd'
  },
  externals: {
    'react': {
      'commonjs': 'react',
      'commonjs2': 'react',
      'amd': 'react',
      // React dep should be available as window.React, not window.react
      'root': 'React'
    },
    'react-dom': {
      'commonjs': 'react-dom',
      'commonjs2': 'react-dom',
      'amd': 'react-dom',
      'root': 'ReactDOM'
    }
  },
  plugins: [
    new ExtractTextPlugin('redux-bug-reporter.css')
  ],
  module: {
    rules: [
      {
        test: /\.jsx?/,
        use: 'babel-loader',
        exclude: /node_modules/
      }, {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'postcss-loader', 'less-loader' ]
        })
      }
    ]
  },
  resolve: {
    extensions: ['.jsx', '.js', '.less']
  }
}

if (process.env.NODE_ENV === 'production') {
  config.output.filename = 'redux-bug-reporter.min.js'
  config.plugins = [
    new ExtractTextPlugin('redux-bug-reporter.min.css'),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
}

module.exports = config
