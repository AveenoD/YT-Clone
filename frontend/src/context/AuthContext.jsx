import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/current-user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (err) {
      console.error('Token verification failed:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setError(null);
    try {
      const isEmail = identifier.includes('@');
      const requestBody = {
        password
      };
      
      if (isEmail) {
        requestBody.email = identifier;
      } else {
        requestBody.username = identifier;
      }

      const response = await fetch('http://localhost:5000/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Save tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Set user
      setUser(data.data.user);
      
      // Redirect to home
      navigate('/');
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (formData, avatarFile, coverImageFile) => {
    setError(null);
    try {
      const registerData = new FormData();
      registerData.append('username', formData.username.trim());
      registerData.append('email', formData.email.trim());
      registerData.append('fullName', formData.fullName.trim());
      registerData.append('password', formData.password);
      
      if (avatarFile) {
        registerData.append('avatar', avatarFile);
      }
      
      if (coverImageFile) {
        registerData.append('coverImage', coverImageFile);
      }

      const response = await fetch('http://localhost:5000/api/v1/users/register', {
        method: 'POST',
        body: registerData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Save tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      // Set user
      setUser(data.data);
      
      // Redirect to home
      navigate('/');
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      // Note: Backend endpoint not implemented yet
      // This is a placeholder for when backend is ready
      console.log('Forgot password request for:', email);
      
      // Simulate success for now
      setTimeout(() => {
        alert('If this email exists in our system, you will receive a password reset link shortly.');
      }, 1000);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include'
      });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      
      if (response.ok) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};