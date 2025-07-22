import React from 'react';
import { Moon, Sun, Download, Upload } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onImport: () => void;
  onExport: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  sidebar,
  darkMode,
  onToggleDarkMode,
  onImport,
  onExport
}) => {
  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            State Machine Workflow Editor
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Import/Export buttons */}
          <button
            onClick={onImport}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors duration-200"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>

          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors duration-200"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto ${darkMode ? 'dark:bg-gray-900 dark:border-gray-700' : ''}`}>
          {sidebar}
        </aside>

        {/* Main canvas area */}
        <main className="flex-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
