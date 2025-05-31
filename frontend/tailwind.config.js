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
      fontFamily: {
        orbitron: ['"Orbitron"', "sans-serif"],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};