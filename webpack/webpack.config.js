const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
   mode: "production",
   entry: {
      //popup: path.join(srcDir, 'popup.tsx'),
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
      extensions: [".ts", ".js"],
   },
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
         },
      ],
   },
   plugins: [
    new CopyPlugin({
        patterns: [{ from: ".", to: ".", context: "public" }],
        options: {},
    }),
   ],
};