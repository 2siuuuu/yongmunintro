import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export function render() {
  return renderToString(<App />);
}

// Export the same component for hydration tests against generated HTML.
export { App };
