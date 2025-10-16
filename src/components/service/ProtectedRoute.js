import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('authToken');
  const expiry = localStorage.getItem('authTokenExpiry');
  const isAuthenticated =
    token &&
    expiry &&
    Date.now() < Number(expiry);

  return isAuthenticated ? element : <Navigate to="/" />;
};

export default ProtectedRoute;