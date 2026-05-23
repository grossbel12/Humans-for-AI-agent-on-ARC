import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        moss: "#1f4d3a",
        coral: "#e05d44",
        paper: "#f8f6f0"
      }
    }
  },
  plugins: []
};

export default config;
