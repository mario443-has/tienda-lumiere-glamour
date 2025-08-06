/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html', // Tus plantillas Django
    './static/js/**/*.js',   // Tus JS personalizados
    './store/templates/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
