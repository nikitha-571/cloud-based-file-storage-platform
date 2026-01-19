import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sharesAPI, filesAPI } from '../services/api';
import { Users, File, Folder, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

function Shared() {
  const [sharedItems, setSharedItems] = useState([]);
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
      loadSharedItems();
    }
  }, [navigate]);

  const loadSharedItems = async () => {
    setLoading(true);
    try {
      const response = await sharesAPI.getSharedWithMe();
      setSharedItems(response.data);
    } catch (error) {
      console.error('Error loading shared items:', error);
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

  const handleDownload = async (fileId, fileName) => {
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
              <Users className="text-purple-500" size={32} />
              <h2 className="text-2xl font-bold">Shared with Me</h2>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : sharedItems.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">No shared items yet</p>
                <p className="text-gray-400">Files and folders shared with you will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sharedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.item.id}-${index}`}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {item.type === 'file' ? (
                        <File className="text-purple-500 shrink-0" size={32} />
                      ) : (
                        <Folder className="text-purple-500 shrink-0" size={32} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.item.name}</p>
                        {item.type === 'file' && (
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.item.file_size)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {item.share.role === 'viewer' ? '👁️ Viewer' : '✏️ Editor'}
                        </p>
                      </div>
                    </div>
                    {item.type === 'file' && (
                      <button
                        onClick={() => handleDownload(item.item.id, item.item.name)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm mt-2"
                      >
                        <Download size={16} /> Download
                      </button>
                    )}
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

export default Shared;