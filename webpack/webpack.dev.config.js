var webpack = require('webpack');
const path = require('path');

const parentDir = path.join(__dirname, '../');

module.exports = {
  devtool: 'inline-source-map',
  entry: [
    path.join(parentDir, 'src/index.js')
  ],
  output: {
    path: parentDir + 'resources/public/js',
    filename: './js/bundle.js'
  },
  devServer: {
    contentBase: parentDir + 'resources/public/',
    historyApiFallback: true
  }
}
