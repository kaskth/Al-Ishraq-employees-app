import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import { router } from './router';
import App from './App.vue';

// Import Quasar css and fonts
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading,
  },
  config: {
    notify: {
      position: 'top',
      timeout: 3000,
    },
    brand: {
      primary: '#313C8E',
      secondary: '#67CBE2',
      accent: '#F59E0B',
      positive: '#10B981',
      negative: '#EF4444',
      info: '#67CBE2',
      warning: '#F59E0B',
    },
  },
});

app.mount('#app');
