import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX } from 'react-icons/fi';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          ParentKid Connect
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          {!user ? (
            <>
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <Link to="/pricing" className="hover:text-blue-600">Pricing</Link>
              <div className="flex gap-4">
                <Link
                  to="/login/parent"
                  className="px-4 py-2 border border-blue-600 rounded text-blue-600 hover:bg-blue-50"
                >
                  Parent Login
                </Link>
                <Link
                  to="/login/teen"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Teen Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <Link to="/pricing" className="hover:text-blue-600">Upgrade</Link>
              <div className="flex gap-4 items-center">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-100 p-4 space-y-4">
          <Link to="/" className="block hover:text-blue-600">Home</Link>
          <Link to="/pricing" className="block hover:text-blue-600">Pricing</Link>
          {!user ? (
            <div className="space-y-2">
              <Link to="/login/parent" className="block text-center px-4 py-2 border border-blue-600 rounded text-blue-600">
                Parent Login
              </Link>
              <Link to="/login/teen" className="block text-center px-4 py-2 bg-blue-600 text-white rounded">
                Teen Login
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded"
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