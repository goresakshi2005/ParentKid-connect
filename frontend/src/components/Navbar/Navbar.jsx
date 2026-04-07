import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';

function Navbar() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-pink-500 hover:scale-105 transition-transform duration-300">
          ParentKid <span className="dark:text-white">Connect</span>
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <FiSun className="text-yellow-400 text-xl" /> : <FiMoon className="text-slate-700 text-xl" />}
          </button>
          {!user ? (
            <>
              <Link to="/" className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">Home</Link>
              <Link to="/pricing" className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">Pricing</Link>
              <div className="flex gap-4">
                <Link
                  to="/login/parent"
                  className="px-4 py-2 border border-blue-600 rounded text-blue-600 hover:bg-blue-50 dark:border-pink-500/50 dark:text-pink-400 dark:hover:bg-pink-500/10 transition-all duration-300"
                >
                  Parent Login
                </Link>
                <Link
                  to="/login/teen"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 dark:shadow-lg dark:shadow-pink-500/20 transition-all duration-300"
                >
                  Teen Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">Home</Link>
              {/* Dashboard link based on role */}
              {user.role === 'mentor' ? (
                <Link to="/dashboard/mentor" className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 flex items-center gap-1">
                  🧑‍🏫 My Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to={user.role === 'teen' ? '/mentor-chat/teen?stage=teen_age' : '/mentor-chat'}
                    className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 flex items-center gap-1"
                  >
                    💬 Mentor Chat
                  </Link>
                  <Link to="/pricing" className="hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">Upgrade</Link>
                </>
              )}
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <FiSun className="text-yellow-400 text-xl" /> : <FiMoon className="text-slate-700 text-xl" />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-2xl text-gray-600 dark:text-gray-300"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-100 dark:bg-slate-800 p-4 space-y-4">
          <Link to="/" className="block hover:text-blue-600 dark:text-gray-200">Home</Link>
          <Link to="/pricing" className="block hover:text-blue-600 dark:text-gray-200">Pricing</Link>
          {user && (
            user.role === 'mentor' ? (
              <Link to="/dashboard/mentor" className="block hover:text-blue-600 dark:text-gray-200">
                🧑‍🏫 My Dashboard
              </Link>
            ) : (
              <Link
                to={user.role === 'teen' ? '/mentor-chat/teen?stage=teen_age' : '/mentor-chat'}
                className="block hover:text-blue-600 dark:text-gray-200"
              >
                💬 Mentor Chat
              </Link>
            )
          )}
          {!user ? (
            <div className="space-y-2">
              <Link to="/login/parent" className="block text-center px-4 py-2 border border-blue-600 rounded text-blue-600 dark:border-blue-400 dark:text-blue-400">
                Parent Login
              </Link>
              <Link to="/login/teen" className="block text-center px-4 py-2 bg-blue-600 text-white rounded dark:bg-blue-500">
                Teen Login
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded dark:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;