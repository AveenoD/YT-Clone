import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from './layout/LoginPage';
import RegisterPage from './layout/RegisterPage';
import HomePage from './pages/HomePage.jsx';
import { ToastProvider } from './toaster/ToastContext';
import { ToastContainer  } from './toaster/ToastContainer';
import VideoPage from './pages/VideoPage.jsx';
import UploadPage from './pages/UploadPage';
import ChannelPage from './pages/ChannelPage.jsx'
const router = createBrowserRouter([
  {
    path:'/login',
    element: <LoginPage />
  },
  {
    path:'/register',
    element: <RegisterPage />
  },
  {
    path:'/',
    element: <App />,
    children:[
      {
        index: true,  element: <HomePage />
      },
      { 
         path: 'video/:videoId', element: <VideoPage /> 
      },
      { 
        path: 'upload', element: <UploadPage /> 
      },
      { 
        path: 'channel/:userId', element: <ChannelPage />
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