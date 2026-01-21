import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesAPI, foldersAPI } from '../services/api';
import { Trash2, RotateCcw, Folder, File , CheckSquare, Square, X} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

function Trash() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState({ files: [], folders: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    if (!token) {
      navigate('/login');
    } else {
      setUserEmail(email);
      loadTrash();
    }
  }, [navigate]);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        filesAPI.getTrashed(),
        foldersAPI.getTrashed()
      ]);
      setFiles(filesRes.data);
      setFolders(foldersRes.data);
      setSelectedItems({ files: [], folders: [] });
      setSelectionMode(false);
    } catch (error) {
      console.error('Error loading trash:', error);
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
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_picture');
    navigate('/login');
  };

  const handleRestoreFile = async (fileId) => {
    try {
      await filesAPI.restore(fileId);
      toast.success('File restored successfully!');
      setTimeout(() => {
        loadTrash();
      }, 500);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error.response?.data?.detail || 'Failed to restore file');
    }
  };

  const handleRestoreFolder = async (folderId) => {
    try {
      await foldersAPI.restore(folderId);
      toast.success('Folder restored successfully!');
      setTimeout(() => {
        loadTrash();
      }, 500);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error.response?.data?.detail || 'Failed to restore folder');
    }
  };

  const handlePermanentDeleteFile = async (fileId, fileName) => {
    if (!confirm(`Permanently delete "${fileName}"? This action cannot be undone!`)) return;

    try {
      await filesAPI.permanentDelete(fileId);
      toast.success('File permanently deleted');
      loadTrash();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to permanently delete file');
    }
  };

  const handlePermanentDeleteFolder = async (folderId, folderName) => {
    if (!confirm(`Permanently delete "${folderName}" and all its contents? This action cannot be undone!`)) return;

    try {
      await foldersAPI.permanentDelete(folderId);
      toast.success('Folder permanently deleted');
      loadTrash();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to permanently delete folder');
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm(`Permanently delete ALL ${files.length + folders.length} items in trash? This action cannot be undone!`)) return;

    try {
     
      const filePromises = files.map(file => filesAPI.permanentDelete(file.id));
      
      const folderPromises = folders.map(folder => foldersAPI.permanentDelete(folder.id));

      await Promise.all([...filePromises, ...folderPromises]);

      toast.success('Trash emptied successfully');
      loadTrash();
    } catch (error) {
      console.error('Empty trash error:', error);
      toast.error(error.response?.data?.detail || 'Failed to empty trash');
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems({ files: [], folders: [] });
  };

  const toggleFileSelection = (fileId) => {
    setSelectedItems(prev => ({
      ...prev,
      files: prev.files.includes(fileId)
        ? prev.files.filter(id => id !== fileId)
        : [...prev.files, fileId]
    }));
  };

  const toggleFolderSelection = (folderId) => {
    setSelectedItems(prev => ({
      ...prev,
      folders: prev.folders.includes(folderId)
        ? prev.folders.filter(id => id !== folderId)
        : [...prev.folders, folderId]
    }));
  };

  const selectAll = () => {
    setSelectedItems({
      files: files.map(f => f.id),
      folders: folders.map(f => f.id)
    });
  };

  const deselectAll = () => {
    setSelectedItems({ files: [], folders: [] });
  };

  const isAllSelected = () => {
    return selectedItems.files.length === files.length && 
           selectedItems.folders.length === folders.length &&
           (files.length > 0 || folders.length > 0);
  };

  const handleRestoreSelected = async () => {
    const totalSelected = selectedItems.files.length + selectedItems.folders.length;
    
    if (totalSelected === 0) {
      toast.error('No items selected');
      return;
    }

    if (!confirm(`Restore ${totalSelected} selected item(s)?`)) {
      return;
    }

    try {
      const filePromises = selectedItems.files.map(fileId => filesAPI.restore(fileId));
      const folderPromises = selectedItems.folders.map(folderId => foldersAPI.restore(folderId));

      await Promise.all([...filePromises, ...folderPromises]);

      toast.success(`${totalSelected} item(s) restored successfully`);
      setSelectionMode(false);
      setSelectedItems({ files: [], folders: [] });
      loadTrash();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore some items');
    }
  };

  const handleDeleteSelected = async () => {
    const totalSelected = selectedItems.files.length + selectedItems.folders.length;
    
    if (totalSelected === 0) {
      toast.error('No items selected');
      return;
    }

    if (!confirm(`Permanently delete ${totalSelected} selected item(s)? This cannot be undone!`)) {
      return;
    }

    try {
      const filePromises = selectedItems.files.map(fileId => filesAPI.permanentDelete(fileId));
      const folderPromises = selectedItems.folders.map(folderId => foldersAPI.permanentDelete(folderId));

      await Promise.all([...filePromises, ...folderPromises]);

      toast.success(`${totalSelected} item(s) permanently deleted`);
      setSelectionMode(false);
      setSelectedItems({ files: [], folders: [] });
      loadTrash();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete some items');
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trash2 className="text-red-500" size={32} />
                <h2 className="text-2xl font-bold">Trash</h2>
              </div>

              <div className="flex gap-2">
                {!selectionMode ? (
                  <>
                    {(files.length > 0 || folders.length > 0) && (
                      <>
                        <button
                          onClick={toggleSelectionMode}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          <CheckSquare size={20} />
                        </button>
                        <button
                          onClick={handleEmptyTrash}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <Trash2 size={20} />
                          Empty Trash ({files.length + folders.length})
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={isAllSelected() ? deselectAll : selectAll}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <CheckSquare size={20} />
                      {isAllSelected() ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={handleRestoreSelected}
                      disabled={selectedItems.files.length === 0 && selectedItems.folders.length === 0 }
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw size={20} />
                      Restore ({selectedItems.files.length + selectedItems.folders.length})
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedItems.files.length === 0 && selectedItems.folders.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={20} />
                      Delete Forever ({selectedItems.files.length + selectedItems.folders.length})
                    </button>

                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      <X size={20} />
                      Cancel
                    </button>
                  </>
                
              )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Loading trash..." />
              </div>
            ) : files.length === 0 && folders.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 text-lg">Trash is empty</p>
                <p className="text-gray-400">Deleted items will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Folders */}
                {folders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    className={`border-2 rounded-lg p-4 transition ${
                      selectionMode && selectedItems.folders.includes(folder.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-red-400 hover:shadow-md'
                    }`}
                  >
                    {selectionMode && (
                      <button
                        onClick={() => toggleFolderSelection(folder.id)}
                        className="mb-2"
                      >
                        {selectedItems.folders.includes(folder.id) ? (
                          <CheckSquare size={24} className="text-blue-600" />
                        ) : (
                          <Square size={24} className="text-gray-400" />
                        )}
                      </button>
                    )}
                    <div className="flex items-start gap-3 mb-2">
                      <Folder className="text-gray-400 shrink-0" size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{folder.name}</p>
                        <p className="text-sm text-gray-500">Folder</p>
                        <p className="text-xs text-gray-400">
                          {new Date(folder.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {!selectionMode && (
                      <div className="flex flex-col gap-2 mt-3">
                      <button
                        onClick={() => handleRestoreFolder(folder.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                      >
                        <RotateCcw size={16} /> Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDeleteFolder(folder.id, folder.name)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                        title="Delete Forever"
                      >
                        <Trash2 size={16} /> Delete Forever
                      </button>
                    </div>
                    )}
                  </div>
                ))}

                {/* Files */}
                {files.map((file) => (
                  <div
                    key={`file-${file.id}`}
                    className={`border-2 rounded-lg p-4 transition ${
                      selectionMode && selectedItems.files.includes(file.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-red-400 hover:shadow-md'
                    }`}
                  >
                    {selectionMode && (
                      <button
                        onClick={() => toggleFileSelection(file.id)}
                        className="mb-2"
                      >
                        {selectedItems.files.includes(file.id) ? (
                          <CheckSquare size={24} className="text-blue-600" />
                        ) : (
                          <Square size={24} className="text-gray-400" />
                        )}
                      </button>
                    )}
                    <div className="flex items-start gap-3 mb-2">
                      <File className="text-gray-400 shrink-0" size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file_size)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {!selectionMode && (
                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          onClick={() => handleRestoreFile(file.id)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
                        >
                          <RotateCcw size={16} /> Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDeleteFile(file.id, file.name)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                          title="Delete Forever"
                        >
                          <Trash2 size={16} /> Delete Forever
                        </button>
                      </div>
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

export default Trash;