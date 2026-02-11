import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/current-user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      const userData = data.data;
      
      setUser(userData);
      setFormData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        username: userData.username || ''
      });
      
      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      }
      
      if (userData.coverImage) {
        setCoverImagePreview(userData.coverImage);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
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
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email is invalid');
      return;
    }
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Update profile details
      const profileResponse = await fetch('http://localhost:5000/api/v1/users/update-account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      // Update avatar if selected
      if (avatarFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('avatar', avatarFile);
        
        const avatarResponse = await fetch('http://localhost:5000/api/v1/users/profile/avatar', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: formDataToSend
        });

        if (!avatarResponse.ok) {
          const errorData = await avatarResponse.json();
          throw new Error(errorData.message || 'Failed to update avatar');
        }
      }

      // Update cover image if selected
      if (coverImageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('coverImage', coverImageFile);
        
        const coverResponse = await fetch('http://localhost:5000/api/v1/users/profile/coverImage', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: formDataToSend
        });

        if (!coverResponse.ok) {
          const errorData = await coverResponse.json();
          throw new Error(errorData.message || 'Failed to update cover image');
        }
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-red-500 to-red-600">
          {coverImagePreview ? (
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
          ) : user.coverImage ? (
            <img
              src={user.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-lg">
              No cover image
            </div>
          )}
        </div>
        
        {/* Avatar */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-gray-600 mt-1">@{user.username}</p>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Avatar</h3>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-500">
                    <img 
                      src={avatarPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className="hidden"
                  id="avatarInput"
                  disabled={isLoading}
                />
                <label
                  htmlFor="avatarInput"
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
                >
                  Choose Avatar
                </label>
                {avatarFile && (
                  <p className="mt-2 text-sm text-gray-600">{avatarFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cover Image</h3>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                {coverImagePreview ? (
                  <div className="w-48 h-24 rounded-lg overflow-hidden border-2 border-red-500">
                    <img 
                      src={coverImagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'coverImage')}
                  className="hidden"
                  id="coverInput"
                  disabled={isLoading}
                />
                <label
                  htmlFor="coverInput"
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
                >
                  Choose Cover
                </label>
                {coverImageFile && (
                  <p className="mt-2 text-sm text-gray-600">{coverImageFile.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Updating...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;