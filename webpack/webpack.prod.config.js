const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: [
    path.join(__dirname, '../src/index.js')
  ],
  plugins: [
    new UglifyJSPlugin()
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../resources/public/js/')
  }

};
