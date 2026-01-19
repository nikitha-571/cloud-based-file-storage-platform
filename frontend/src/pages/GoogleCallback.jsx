import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckCircle, XCircle } from 'lucide-react';

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); 
  const [error, setError] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Google authentication was cancelled or failed');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setError('No authorization code received');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    try {

      const response = await authAPI.googleCallback(code);

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_email', response.data.user.email);
      localStorage.setItem('user_name', response.data.user.full_name);
      
      if (response.data.user.profile_picture) {
        localStorage.setItem('user_picture', response.data.user.profile_picture);
      }

      setStatus('success');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setError(error.response?.data?.detail || 'Failed to authenticate with Google');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 text-center">
        {status === 'loading' && (
          <>
            <LoadingSpinner size="xl" />
            <h2 className="text-xl font-semibold text-gray-800 mt-6">
              Signing you in...
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we complete your authentication
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-800">
              Success!
            </h2>
            <p className="text-gray-600 mt-2">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto text-red-500 mb-4" size={64} />
            <h2 className="text-xl font-semibold text-gray-800">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default GoogleCallback;