import './style.css';
import { App } from './app';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
const ui = document.getElementById('ui');

if (!canvas || !ui) {
  throw new Error('Odyssey Survival: missing #game-canvas or #ui in the document');
}

const app = new App(canvas, ui);
app.start();

// iOS Safari fires a resize *after* the address bar settles; nudging the layout
// on load avoids a canvas that is a bar-height too tall on first paint.
window.addEventListener('load', () => window.dispatchEvent(new Event('resize')));
