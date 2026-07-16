// src/plugins/vuetify.js
import { createVuetify } from 'vuetify';
import 'vuetify/styles';

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light', // or 'dark'
  },
});

export default vuetify;
