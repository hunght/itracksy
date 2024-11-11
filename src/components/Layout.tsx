import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">iTracksy</h1>
        </div>
        <ul className="space-y-2">
          <li>
            <Link 
              to="/" 
              className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Projects
            </Link>
          </li>
          <li>
            <Link 
              to="/settings" 
              className="block px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout; 