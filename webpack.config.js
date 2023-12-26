const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * Babel은 Webpack과 함께 사용되어 JS 및 JSX 파일을 변환하는 데 사용됩니다. 
 * webpack.config.js 파일에서 babel-loader를 설정하여 이를 수행합니다.
 */

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['file-loader']
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: {
        directory: path.join(__dirname, 'public'),
      }
  },
};
