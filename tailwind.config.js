/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: { 
      colors: {
        // Votre palette personnalisée
        'primary-dark': '#0A0A0A',
        'primary-blue': '#0F1C2E',
        'accent-purple': '#6C63FF',
        'accent-blue': '#3366FF', 
        'neon-cyan': '#00D4FF',
        // Couleurs RPG supplémentaires
        'rpg-gray': '#8B949E',
        'rpg-gold': '#EDAE0A', // Pour les récompenses
      },
      fontFamily: {
        // Si vous voulez une police personnalisée
        'solo': ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        // Effets glow Solo Leveling
        'glow-purple': '0px 0px 15px rgba(108, 99, 255, 0.7)',
        'glow-blue': '0px 0px 20px rgba(51, 102, 255, 0.5)',
      }},
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};
