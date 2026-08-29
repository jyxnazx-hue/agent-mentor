/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          base: "#FBF9F5",
          surface: "#FFFFFF",
          card: "#FDFBF7",
          border: "#E5E0D8",
        },
        slate: {
          primary: "#1E2022",
          secondary: "#4A4E54",
          muted: "#8C9097",
        },
      },
    },
  },
  plugins: [],
};