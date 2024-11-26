import React from 'react';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Layout from './components/Layout';
import {Dashboard} from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';

// Using HashRouter instead of BrowserRouter for Electron compatibility
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App; 