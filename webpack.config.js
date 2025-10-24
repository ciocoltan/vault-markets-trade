const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: {
    index: "./frontend/js/index.js",
    login: "./frontend/js/login.js",
    register: "./frontend/js/register.js",
    forgotPassword: "./frontend/js/forgot-password.js",
    multistep: "./frontend/js/multistep.js",
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          "postcss-loader",
        ],
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "frontend/img", to: "img" },
        { from: "frontend/header.html", to: "header.html" },
        { from: "frontend/footer.html", to: "footer.html" },
        { from: "frontend/fonts", to: "fonts" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/index.html",
      filename: "index.html",
      chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/login.html",
      filename: "login/index.html",
      chunks: ["login"],
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/register.html",
      filename: "register/index.html",
      chunks: ["register"],
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/forgot-password.html",
      filename: "forgot-password/index.html",
      chunks: ["forgotPassword"],
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/multistep.html",
      filename: "multistep/index.html",
      chunks: ["multistep"],
    }),
  ],
  devServer: {
    static: "./dist",
    port: 8080,
    historyApiFallback: true,
  },
};
