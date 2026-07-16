/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        burdeos: "#150A0F",
        panel: "#241017",
        oro: "#E3B34C",
        crema: "#F3E7D3",
        sangre: "#E0604F",
        acero: "#8FB3C7",
      },
      fontFamily: {
        titulo: ["'Cinzel'", "serif"],
        texto: ["'Alegreya Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        "moneda-giro": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        "fuego-parpadeo": {
          "0%, 100%": { opacity: 1, filter: "brightness(1)" },
          "50%": { opacity: 0.75, filter: "brightness(1.3)" },
        },
        "carta-voltea": {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "panico-pulso": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(224,96,79,0.6)" },
          "50%": { boxShadow: "0 0 0 10px rgba(224,96,79,0)" },
        },
        "estrella-titila": {
          "0%, 100%": { opacity: 0.25 },
          "50%": { opacity: 1 },
        },
        "corona-brillo": {
          "0%, 100%": { filter: "drop-shadow(0 0 2px rgba(227,179,76,0.35))" },
          "50%": { filter: "drop-shadow(0 0 7px rgba(227,179,76,0.95))" },
        },
        "linea-marcha": {
          to: { strokeDashoffset: -16 },
        },
        "agua-brillo": {
          "0%, 100%": { opacity: 0.35 },
          "50%": { opacity: 0.7 },
        },
      },
      animation: {
        "moneda-giro": "moneda-giro 1.2s linear infinite",
        "fuego-parpadeo": "fuego-parpadeo 1.4s ease-in-out infinite",
        "carta-voltea": "carta-voltea 0.7s ease-in-out",
        "panico-pulso": "panico-pulso 1.6s ease-in-out infinite",
        "estrella-titila": "estrella-titila 3s ease-in-out infinite",
        "corona-brillo": "corona-brillo 2.2s ease-in-out infinite",
        "linea-marcha": "linea-marcha 1.4s linear infinite",
        "agua-brillo": "agua-brillo 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
