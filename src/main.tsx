import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// 阻止加载bolt.new的脚本
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = node as HTMLScriptElement;
        if (script.src && script.src.includes('bolt.new')) {
          script.remove();
          console.log('Blocked script from bolt.new');
        }
      }
    });
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });