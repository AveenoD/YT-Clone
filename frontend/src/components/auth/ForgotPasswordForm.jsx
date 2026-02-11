import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordForm = ({ onSwitchForm, onError }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      onError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      onError('Email is invalid');
      return;
    }
    
    setIsLoading(true);
    onError('');
    
    const result = await forgotPassword(email);
    
    if (result.success) {
      setSubmitted(true);
    } else {
      onError(result.error);
    }
    
    setIsLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl text-green-400 mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-gray-300 mb-6">
          If an account exists with {email}, you'll receive a password reset link shortly.
        </p>
        <button
          onClick={() => onSwitchForm('login')}
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
          placeholder="Enter your email address"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 shadow-lg hover:shadow-red-500/30"
      >
        {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
      </button>
      
      <p className="text-sm text-gray-400 text-center">
        Remember your password?{' '}
        <button
          type="button"
          onClick={() => onSwitchForm('login')}
          className="text-red-400 hover:text-red-300 font-medium"
        >
          Sign In
        </button>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;