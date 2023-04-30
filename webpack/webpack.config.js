const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { VueLoaderPlugin } = require('vue-loader');
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
   mode: "production",
   entry: {
      'popup/index': path.join(srcDir, 'popup/main.ts'),
      //options: path.join(srcDir, 'options.tsx'),
      background: [
         path.join(srcDir, 'background.ts'),
      ],
      content: [
         path.join(srcDir, 'content.ts'),
      ],
   },
   output: {
      path: path.join(__dirname, "../load_me"),
      filename: "[name].js",
   },
   resolve: {
      extensions: [".ts", ".js", ".vue"],
      alias: {
         "@/*": [
            "./src/*"
         ],
         vue: '@vue/runtime-dom'
      },
      modules: ['node_modules']
   },
   module: {
      rules: [
         {
            test: /\.ts$/,
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/]
            },
            exclude: /node_modules/
          },
         {
            test: /\.vue$/,
            loader: 'vue-loader'
         },
         {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader']
         },
      ],
   },
   plugins: [
    new CopyPlugin({
        patterns: [{ from: ".", to: ".", context: "public" }],
        options: {},
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
   ],
};