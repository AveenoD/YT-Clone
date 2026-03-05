import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import LoginPage from './layout/LoginPage';
import RegisterPage from './layout/RegisterPage';
import HomePage from './pages/HomePage.jsx';
import { ToastProvider } from './toaster/ToastContext';
import { ToastContainer } from './toaster/ToastContainer';
import VideoPage from './pages/VideoPage.jsx';
import UploadPage from './pages/UploadPage';
import ChannelPage from './pages/ChannelPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LikedVideosPage from './pages/LikedVideosPage';
import SettingsPage from './pages/SettingsPage.jsx';
import WatchLaterPage from './pages/WatchLaterPage';
import PlaylistPage from './pages/PlaylistPage.jsx';
import PlaylistDetailPage from './pages/PlaylistDetailPage.jsx';
import TweetsPage from './pages/TweetsPage';
import SubscribersPage from './pages/SubscribersPage';
import CommingSoon from './pages/CommingSoon.jsx';

// ✅ RootLayout ensures ToastContainer is inside the router tree
// so it has proper access to React context
function RootLayout() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
            path: 'settings', element: <SettingsPage />
          },
          {
            path: 'watchlater', element: <WatchLaterPage />
          },
          {
            path: 'playlist', element: <PlaylistPage />
          },
          {
            path: 'playlist/:playlistId', element: <PlaylistDetailPage />
          },
          {
            path: 'posts', element: <TweetsPage />
          },
          {
            path: 'subscribers', element: <SubscribersPage />
          },
          {
            path: 'commingsoon', element: <CommingSoon />
          }
        ]
      }
    ]
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <RouterProvider router={router} />
  </ToastProvider>
);