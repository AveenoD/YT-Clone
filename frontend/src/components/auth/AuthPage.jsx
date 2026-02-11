import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthPage = () => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login', 'register', 'forgot-password'
  const [error, setError] = useState('');

  const handleFormSwitch = (form) => {
    setCurrentForm(form);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {currentForm === 'login' ? 'Welcome Back' : 
               currentForm === 'register' ? 'Create Account' : 
               'Reset Password'}
            </h1>
            <p className="text-gray-300">
              {currentForm === 'login' ? 'Sign in to continue your journey' : 
               currentForm === 'register' ? 'Join us and start exploring' : 
               'Enter your email to reset your password'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {currentForm === 'login' && (
            <LoginForm 
              onSwitchForm={handleFormSwitch} 
              onError={setError}
            />
          )}
          
          {currentForm === 'register' && (
            <RegisterForm 
              onSwitchForm={handleFormSwitch} 
              onError={setError}
            />
          )}
          
          {currentForm === 'forgot-password' && (
            <ForgotPasswordForm 
              onSwitchForm={handleFormSwitch} 
              onError={setError}
            />
          )}

          <div className="mt-6 text-center">
            {currentForm === 'login' && (
              <>
                <p className="text-gray-300 mb-2">Don't have an account?</p>
                <button
                  onClick={() => handleFormSwitch('register')}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Create Account
                </button>
                <div className="mt-4">
                  <button
                    onClick={() => handleFormSwitch('forgot-password')}
                    className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}
            
            {currentForm === 'register' && (
              <>
                <p className="text-gray-300 mb-2">Already have an account?</p>
                <button
                  onClick={() => handleFormSwitch('login')}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
            
            {currentForm === 'forgot-password' && (
              <>
                <p className="text-gray-300 mb-2">Remember your password?</p>
                <button
                  onClick={() => handleFormSwitch('login')}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Streamify. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;