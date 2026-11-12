import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';

// iOS Safari only applies :active styles when a touch listener is registered.
document.addEventListener('touchstart', () => {}, { passive: true });

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
