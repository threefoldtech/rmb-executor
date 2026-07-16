// src/plugins/vuetify.ts
import { createVuetify } from "vuetify";
import "vuetify/styles";

const gridDark = {
  dark: true,
  colors: {
    background: "#070b14",
    surface: "#0d1424",
    "surface-variant": "#182238",
    "on-surface-variant": "#94a3b8",
    primary: "#2dd4bf",
    "on-primary": "#04211d",
    secondary: "#38bdf8",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
    info: "#38bdf8",
  },
};

const vuetify = createVuetify({
  theme: {
    defaultTheme: "gridDark",
    themes: { gridDark },
  },
  defaults: {
    VTextField: { variant: "outlined", color: "primary", density: "comfortable" },
    VTextarea: { variant: "outlined", color: "primary" },
  },
});

export default vuetify;
