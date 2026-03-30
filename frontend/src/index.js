import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import AuthProvider from './context/AuthContext';
import SubscriptionProvider from './context/SubscriptionContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </AuthProvider>
  </React.StrictMode>
);