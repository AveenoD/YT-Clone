import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = ({ onSwitchForm, onError }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    onError('');
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setCoverImageFile(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
    onError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username.trim()) {
      onError('Username is required');
      return;
    }
    
    if (!formData.email.trim()) {
      onError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      onError('Email is invalid');
      return;
    }
    
    if (!formData.fullName.trim()) {
      onError('Full name is required');
      return;
    }
    
    if (!formData.password) {
      onError('Password is required');
      return;
    }
    
    if (formData.password.length < 6) {
      onError('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      onError('Passwords do not match');
      return;
    }
    
    if (!avatarFile) {
      onError('Avatar is required');
      return;
    }
    
    setIsLoading(true);
    onError('');
    
    const result = await register(formData, avatarFile, coverImageFile);
    
    if (!result.success) {
      onError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
            placeholder="Choose a username"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-200 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
          placeholder="Enter your email address"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            placeholder="Create a password"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
            placeholder="Confirm your password"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Avatar <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarPreview ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-500">
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
          </div>
          
          <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block">
            Choose Avatar
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'avatar')}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Cover Image (Optional)
        </label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {coverImagePreview ? (
              <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-gray-500">
                <img 
                  src={coverImagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-16 rounded-lg bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
          </div>
          
          <label className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block">
            Choose Cover
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'coverImage')}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 shadow-lg hover:shadow-red-500/30"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;