const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === "production" ? "/domain/" : "/",
  transpileDependencies: true,
  devServer: {
    port:9000,
    proxy: {
      "/api": {
        target: "http://202.112.51.128:9078",
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
