/** @type {import('tailwindcss').Config} */

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });

    return config;
  },
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/not-found.js",
    './styles/**/*.{css,scss}',  // 添加這行以包含樣式文件
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      screens: {
        DEFAULT: '100%',
        max: '1920px',
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        "primary": "#FF00D5",
        // "primaryLighter": "rgb(255, 171, 241)",
        "primaryLighter": "rgb(255, 146, 237)",
        "primaryLightest": "rgb(255, 210, 248)",
        "secondary": "rgb(232, 181, 255)",
        "tertiary": "#F9F9F9",
        "fourth": "#919191",
      },
      fontFamily: {
        "noto-sans-tc": ["Noto Sans TC", "Arial", "Verdana"],
        "roboto": ["Roboto", "Noto Sans TC", "Arial"],
      },
      fontSize: {
        "xxs": "0.625rem", // 10px
        "2xl": "1.375rem", // 22px
        "3xl": "1.5rem", // 24px
        "4xl": "1.625rem", // 26px
        "5xl": "1.75rem", // 28px
        "6xl": "1.875rem", // 30px
        "7xl": "2rem", // 32px
      },
      zIndex: {
        "-1": "-1",
        "100": "100",
      },
      spacing: {
        "25": "6.25rem",
      },
      boxShadow: {
        "major": "0px 8px 20px 0px rgba(37, 138, 193, 0.10)",
      }
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};