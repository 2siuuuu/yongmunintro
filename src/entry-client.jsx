import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/main.css';

const container = document.getElementById('root');
if (container.hasChildNodes() && container.querySelector('main')) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
