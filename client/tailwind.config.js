/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        scout: {
          sky: "#7DD3FC",
          grass: "#86EFAC",
          sun: "#FDE047",
          berry: "#F472B6",
          earth: "#A78BFA",
        },
      },
      boxShadow: {
        chunky: "0 6px 0 0 rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
