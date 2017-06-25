const path = require('path')

// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack')

const config = {
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
    new webpack.NoEmitOnErrorsPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.jsx?/,
        use: {
          loader: 'babel-loader',
          options: {
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
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [ 'style-loader', 'css-loader', 'postcss-loader', 'less-loader' ]
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader', 'postcss-loader' ]
      }
    ]
  },
  resolve: {
    extensions: ['.jsx', '.js', '.json', '.less']
  },
  devServer: {
    port: 3000,
    contentBase: 'example/'
  }
}

module.exports = config
