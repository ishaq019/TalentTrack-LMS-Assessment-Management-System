// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "Roboto"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124, 58, 237, 0.35), 0 10px 30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: []
};
