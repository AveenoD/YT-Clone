import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './layout/LoginPage';
import RegisterPage from './layout/RegisterPage';
import HomePage from './pages/HomePage.jsx';
import { ToastProvider } from './toaster/ToastContext';
import { ToastContainer } from './toaster/ToastContainer';
import VideoPage from './pages/VideoPage.jsx';
import UploadPage from './pages/UploadPage';
import ChannelPage from './pages/ChannelPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx';
import HistoryPage     from './pages/HistoryPage.jsx';
import LikedVideosPage from './pages/LikedVideosPage';
import SettingsPage from './pages/SettingsPage.jsx';
import WatchLaterPage from './pages/WatchLaterPage';
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, element: <HomePage />
      },
      {
        path: 'video/:videoId', element: <VideoPage />
      },
      {
        path: 'upload', element: <UploadPage />
      },
      {
        path: 'channel/:userId', element: <ChannelPage />
      },
      {
        path: 'profile', element: <ProfilePage />
      },
      {
        path: 'history', element: <HistoryPage />

      },
      {
        path: 'liked', element: <LikedVideosPage />

      },
      {
        path: 'settings', element: <SettingsPage/>

      },
      { 
        path: 'watchlater', element: <WatchLaterPage /> 
      }

    ]
  }
]);
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <ToastProvider>
    <RouterProvider router={router} />
    <ToastContainer />
  </ToastProvider>

);