import { unstableSetRender } from 'antd';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import './assets/main.css';
import App from './App';

// Standard rendering setup for Ant Design + React Router
createRoot(document.querySelector(".wrapper")).render(
  <BrowserRouter>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </BrowserRouter>
);

// Custom unstableSetRender setup (if needed)
unstableSetRender((node, container) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;
  root.render(node);
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
