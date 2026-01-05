/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'premium-navy': '#0A1929',      // كحلي عميق
        'premium-blue': '#0066FF',       // أزرق كهربائي
        'premium-gold': '#FFD700',       // ذهبي
        'premium-dark': '#0F172A',       // أزرق داكن جداً
        'premium-light': '#F8FAFC',      // أبيض فاتح
      },
      fontFamily: {
        'arabic': ['Cairo', 'Tajawal', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

