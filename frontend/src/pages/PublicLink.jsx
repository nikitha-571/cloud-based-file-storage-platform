import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sharesAPI } from '../services/api';
import { Download, Lock, FileText } from 'lucide-react';

function PublicLink() {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    loadFile();
  }, [token]);

  const loadFile = async (pwd = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sharesAPI.accessPublicLink(token, pwd);
      setFile(response.data);
      setNeedsPassword(false);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.detail?.includes('password')) {
        setNeedsPassword(true);
        setError('This link is password protected');
      } else {
        setError(error.response?.data?.detail || 'Failed to access link');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    loadFile(password);
  };

  const handleDownload = () => {
    if (file && file.download_url) {
      window.open(file.download_url, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Shared File</h1>
          <p className="text-gray-600 mt-2">Access via public link</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : error ? (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>

            {needsPassword && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline mr-2" size={16} />
                    Password Required
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Access File
                </button>
              </form>
            )}
          </div>
        ) : file ? (
          <div>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-2">{file.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Size: {formatFileSize(file.file_size)}</span>
                <span>Type: {file.file_type}</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              <Download size={20} />
              Download File
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              This file was shared with you via a public link
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PublicLink;