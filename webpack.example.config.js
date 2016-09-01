var path = require('path')
var webpack = require('webpack')
var autoprefixer = require('autoprefixer')

var config = {
  devtool: 'eval',
  entry: [
    'babel-polyfill',
    path.join(__dirname, 'index.js')
  ],
  output: {
    path: __dirname,
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          'env': {
            'development': {
              'plugins': [['react-transform', {
                'transforms': [{
                  'transform': 'react-transform-hmr',
                  'imports': ['react'],
                  'locals': ['module']
                }]
              }]]
            }
          }
        }
      },
      {
        test: /\.less$/,
        loader: 'style!css!postcss!less'
      },
      {
        test: /\.css$/,
        loader: 'style!css!postcss'
      }
    ]
  },
  resolve: {
    extensions: ['', '.jsx', '.js', '.json', '.less']
  },
  postcss: function () {
    return [autoprefixer]
  },
  devServer: {
    port: 3000,
    contentBase: 'example/'
  }
}

module.exports = config
