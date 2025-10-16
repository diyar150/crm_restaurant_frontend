module.exports = {
    // Other configurations
    module: {
      rules: [
          {
        test: /\.js$/,
        enforce: 'pre',
        exclude: [
          /node_modules\/stylis-plugin-rtl/,
        ],
        use: ['source-map-loader'],
           },
      ],
    },
    // Other configurations
  };
  

 //  {
        //  test: /\.js$/,
       //   enforce: 'pre',
       //   use: ['source-map-loader'],
       //   exclude: /node_modules/, // Add this line to exclude node_modules from source map loader
       // }, 
  