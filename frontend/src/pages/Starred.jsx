import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI } from '../services/api';
import { Star, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

function Starred() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    if (!token) {
      navigate('/login');
    } else {
      setUserEmail(email);
      loadStarredFiles();
    }
  }, [navigate]);

  const loadStarredFiles = async () => {
    setLoading(true);
    try {
      const response = await filesAPI.getStarred();
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading starred files:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const handleUnstar = async (fileId) => {
    try {
      await filesAPI.toggleStar(fileId);
      loadStarredFiles(); // Reload
    } catch (error) {
      toast.error('Failed to unstar file');
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await filesAPI.getDownloadUrl(fileId);
      window.open(response.data.download_url, '_blank');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Star className="text-yellow-500 fill-yellow-500" size={32} />
              <h2 className="text-2xl font-bold">Starred Files</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Loading starred files..." />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">No starred files yet</p>
                <p className="text-gray-400">Star files to quickly access them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-yellow-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Star className="text-yellow-500 fill-yellow-500 shrink-0" size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file_size)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        <Download size={16} /> Download
                      </button>
                      <button
                        onClick={() => handleUnstar(file.id)}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        title="Unstar"
                      >
                        <Star size={16} className="fill-yellow-500 text-yellow-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Starred;