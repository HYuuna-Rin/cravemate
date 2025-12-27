import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import db from './services/db';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  (async () => {
    try { await db.init(); } catch (e) {}
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })();
}
