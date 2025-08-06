/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './templates/**/*.html', // Tus plantillas Django
    './static/js/**/*.js',   // Tus JS personalizados
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
