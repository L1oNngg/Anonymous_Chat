module.exports = {
  purge: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        green: {
          500: '#4CAF50',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};