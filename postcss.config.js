module.exports = {
  plugins: [
    require('postcss-import')({ path: ['static/css'] }),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
