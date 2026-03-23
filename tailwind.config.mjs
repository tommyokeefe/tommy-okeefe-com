import themePreset from "@tommyokeefe/theme/tailwind-preset";
/** @type {import('tailwindcss').Config} */
export default {
  presets: [themePreset],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [require("@tailwindcss/typography")],
};
