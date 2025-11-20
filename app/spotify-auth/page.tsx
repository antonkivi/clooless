'use client';

import { useEffect, useState } from 'react';
import { exchangeCodeForTokens, getAuthorizationUrl } from '../../utils/spotify/index';

export default function SpotifyAuth() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Authorization denied or failed');
        return;
      }

      if (code) {
        // Exchange code for tokens
        console.log('Authorization code received:', code);
        const success = await exchangeCodeForTokens(code);
        if (success) {
          setStatus('success');
          setMessage('Successfully connected to Spotify!');
          // Close window after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Failed to exchange authorization code');
        }
      } else {
        // Redirect to Spotify authorization
        const authUrl = getAuthorizationUrl();
        window.location.href = authUrl;
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-black mb-4">Spotify Authentication</h1>
        
        {status === 'loading' && (
          <div className="text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p>Connecting to Spotify...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-green-400">
            <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{message}</p>
            <p className="text-sm text-gray-400 mt-2">This window will close automatically...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-400">
            <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{message}</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}