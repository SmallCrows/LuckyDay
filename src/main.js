import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

const targetNode = document.getElementById('app');

targetNode.innerHTML = '';

const app = mount(App, {
  target: targetNode,
});

export default app;