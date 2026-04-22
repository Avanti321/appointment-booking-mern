/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // ✅ This line must be present
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5f6FFF",  // ✅ Add your primary color here
      },
      gridTemplateColumns:{
        auto:'repeat(auto-fill, minmax(200px, 1fr))'
      }
    },
  },
  plugins: [],
}