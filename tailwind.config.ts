import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { withUt } from "uploadthing/tw";

export default withUt({
  content: [
    "./src/**/*.tsx",
    "./package/**/*.{jsx,tsx}",
    "node_modules/daisyui/dist/**/*.js",
    "node_modules/react-daisyui/dist/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  daisyui: {
    /*
    themes: [
      "light",

      "synthwave",
      "halloween",
      "aqua",
      "dracula",
      // "forest",
      // {
      //   forest: {
      //     ...require("daisyui/src/theming/themes")["forest"],
      //     "base-300": "#747264",
      //   },
      // },
      // {
      // dark: {
      //   ...require("daisyui/src/theming/themes")["dark"],
      //   // primary: "blue",
      //   // "base-100": "#BFEA7C",
      //   // secondary: "teal",
      //   // "base-300": "#D7E4C0",
      // },
      // },
    ],
    */
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
    ],
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
}) satisfies Config;
