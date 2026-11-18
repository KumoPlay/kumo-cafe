import '@fontsource-variable/nunito';
import './ui/styles/main.css';
import { render } from 'preact';
import { startOfflineSupport } from './platform/pwa';
import { App } from './ui/App';

const root = document.getElementById('app');
if (root) render(<App />, root);

// iOS Safari ignores user-scalable=no; stop pinch and double-tap zoom while playing.
document.addEventListener('gesturestart', (event) => event.preventDefault());
document.addEventListener('dblclick', (event) => event.preventDefault());

startOfflineSupport();
