const path = require('path');

module.exports = {
  mode: 'development',
  optimization: {
    minimize: false
  },
  entry: './main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test:/\.js$/,
        use: {
          loader:'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [[
              "@babel/plugin-transform-react-jsx",
              { pragma: 'NReact.createElement' } // 这里的配置仅仅是字符串的替换
            ]
            ]
          }
        }
      }
    ]
  }
};
