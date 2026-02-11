import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitchForm, onError }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    onError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.identifier.trim()) {
      onError('Email or username is required');
      return;
    }
    
    if (!formData.password) {
      onError('Password is required');
      return;
    }
    
    setIsLoading(true);
    onError('');
    
    const result = await login(formData.identifier, formData.password);
    
    if (!result.success) {
      onError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-200 mb-2">
          Email or Username
        </label>
        <input
          type="text"
          id="identifier"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
          placeholder="you@example.com or username"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
          placeholder="••••••••"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 shadow-lg hover:shadow-red-500/30"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;