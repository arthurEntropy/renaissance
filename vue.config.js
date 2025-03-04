const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: true,  // Enable source maps for production as well
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'source-map',
    output: {
        devtoolModuleFilenameTemplate: info => {
            var $filename = 'sources://' + info.resourcePath;
            if (info.resourcePath.match(/\.vue$/) && !info.query.match(/type=script/)) {
                $filename = 'webpack-generated:///' + info.resourcePath + '?' + info.hash;
            }
            return $filename;
        },
        devtoolFallbackModuleFilenameTemplate: 'webpack:///[resource-path]?[hash]'
    }
  }
})

