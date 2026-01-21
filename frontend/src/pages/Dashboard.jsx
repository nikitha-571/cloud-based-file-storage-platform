import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { foldersAPI, filesAPI } from '../services/api';
import { Upload, FolderPlus, Home, ChevronRight, Folder, Tag as TagIcon, CheckSquare, Trash2, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ShareModal from '../components/ShareModal';
import AdvancedSearch from '../components/AdvancedSearch';
import ViewToggle from '../components/ViewToggle';
import FilePreviewModal from '../components/FilePreviewModal';
import FileList from '../components/FileList';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import UploadProgress from '../components/UploadProgress';
import VersionHistoryModal from '../components/VersionHistoryModal';
import TagManager from '../components/TagManager';
import FileTagEditor from '../components/FileTagEditor';
import Breadcrumbs from '../components/Breadcrumbs';

function Dashboard() {
  const [userEmail, setUserEmail] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [shareModalItem, setShareModalItem] = useState(null);
  const [shareModalType, setShareModalType] = useState(null);
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [uploads, setUploads] = useState([]);
  const [previewFileId, setPreviewFileId] = useState(null);
  const [previewFileIndex, setPreviewFileIndex] = useState(-1);
  const [versionModalFile, setVersionModalFile] = useState(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagEditorFile, setTagEditorFile] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState({ files: [], folders: [] });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔐 Dashboard: Token check:', {
      exists: !!token,
      length: token?.length,
      preview: token?.substring(0, 20) + '...'
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    if (!token) {
      navigate('/login');
      return;
    }
    setUserEmail(email);
    console.log('📂 useEffect triggered - currentFolder:', currentFolder); 
    loadData(1, currentFolder);  
  
  }, [currentFolder, sortBy, sortOrder]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (previewFileId) {
        if (e.key === 'ArrowRight' && previewFileIndex < files.length - 1) {
          handleNextPreview();
        } else if (e.key === 'ArrowLeft' && previewFileIndex > 0) {
          handlePreviousPreview();
        } else if (e.key === 'Escape') {
          handleClosePreview();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [previewFileId, previewFileIndex, files]);

  const loadData = async (pageNum = 1, folderId = currentFolder) => {
    console.log('🔍 loadData called');
    console.log('   - pageNum:', pageNum);
    console.log('   - folderId parameter:', folderId);
    console.log('   - currentFolder state:', currentFolder);
    setLoading(true);
    setIsSearching(false);
    
    console.log('📂 Loading data for folder:', folderId);
    
    try {
      const [foldersRes, filesRes] = await Promise.all([
        foldersAPI.getAll(folderId),
        filesAPI.getAll(currentFolder, sortBy, sortOrder, pageNum, 50)
      ]);

      const filesData = Array.isArray(filesRes.data) ? filesRes.data : [];
      const foldersData = Array.isArray(foldersRes.data) ? foldersRes.data : [];

      if (pageNum === 1) {
        setFiles(filesData);
      } else {
        setFiles(prev => [...prev, ...filesData]);
      }

      setFolders(foldersData);
      setHasMore(filesData.length === 50);

      if (folderId) {
        try {
          const pathResponse = await foldersAPI.getPath(folderId);
          setBreadcrumbs(pathResponse.data);
          console.log('🍞 Breadcrumbs:', pathResponse.data);
        }catch (error){
          console.error('Failed to load folder path:', error);
          const currentFolderData = foldersData.find(f => f.id === folderId) 
          || await getCurrentFolderInfo(folderId);
          if (currentFolderData) {
            setBreadcrumbs([{ id: currentFolderData.id, name: currentFolderData.name }]);
          }
        }
      } else {
        setBreadcrumbs([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setFiles([]);
      setFolders([]);

      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentFolderInfo = async (folderId) => {
    try {
      const response = await foldersAPI.getAll(null);
      return response.data.find(f => f.id === folderId);
    } catch (error) {
      return null;
    }
  };

  const handleVersionHistory = (file) => {
    setVersionModalFile(file);
  };

  const handleVersionRestore = () => {
    loadData();
  };

  const handleSearch = async (query, filters) => {
    if (!query && !filters.fileType && !filters.minSize && !filters.maxSize) {
      loadData();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setSearchQuery(query);

    try {
      const [foldersRes, filesRes] = await Promise.all([
        query ? foldersAPI.search(query) : Promise.resolve({ data: [] }),
        filesAPI.search(query, filters)
      ]);
      setFolders(foldersRes.data);
      setFiles(filesRes.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_picture');
    navigate('/login');
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    
    const uploadFolderId = currentFolder;
    
    console.log('📤 UPLOAD - Starting upload');
    console.log('📁 UPLOAD - Current folder state:', uploadFolderId);
    console.log('📁 UPLOAD - Upload folder ID (captured):', uploadFolderId);
    console.log('📄 UPLOAD - File name:', file.name);
    
    const token = localStorage.getItem('token');
    console.log('🔐 Upload auth check:');
    console.log('   Token exists:', !!token);
    console.log('   Token length:', token?.length);
    console.log('   Token preview:', token?.substring(0, 30) + '...');
    
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      navigate('/login');
      return;
    }

    const uploadId = Date.now();
    const newUpload = {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
      error: null,
    };

    setUploads(prev => [...prev, newUpload]);

    try {
  
      console.log('📤 Calling filesAPI.upload with folder_id:', uploadFolderId);

      await filesAPI.upload(file, uploadFolderId, (progress) => {
        setUploads(prev =>
          prev.map(upload =>
            upload.id === uploadId
              ? { ...upload, progress }
              : upload
          )
        );
      });

      setUploads(prev =>
        prev.map(upload =>
          upload.id === uploadId
            ? { ...upload, status: 'success', progress: 100 }
            : upload
        )
      );

      toast.success(`${file.name} uploaded successfully!`);
      console.log('🔄 UPLOAD - Reloading with folder:', uploadFolderId);

      
      loadData(1, uploadFolderId);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || 'Upload failed';

      setUploads(prev =>
        prev.map(upload =>
          upload.id === uploadId
            ? { ...upload, status: 'error', error: errorMessage }
            : upload
        )
      );

      toast.error(errorMessage);

      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          navigate('/login');
        }, 2000);
      }
    }
  };
  const handleRemoveUpload = (uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const handleFolderClick = (folderId) => {
    console.log('📂 Opening folder ID:', folderId);
    console.log('📂 Before setState - currentFolder:', currentFolder); 
    
    setCurrentFolder(folderId);
    console.log('📂 After setState - currentFolder:', currentFolder);
  };
  const handleBreadcrumbNavigate = (folderId) => {
    console.log('🍞 Navigating to folder:', folderId);
    setCurrentFolder(folderId);
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    console.log('📤 Files selected:', files.length);
    console.log('📁 Current folder for upload:', currentFolder);
    files.forEach(file => handleFileUpload(file));
    event.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    
    console.log('📦 Drop - Current folder:', currentFolder);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileUpload(file)); 
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await foldersAPI.create(newFolderName, currentFolder);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadData(1,currentFolder);
      toast.success(`Folder "${newFolderName}" created!`);
    } catch (error) {
      toast.error('Failed to create folder: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Move this file to trash?')) return;

    try {
      await filesAPI.delete(fileId);
      toast.success('File moved to trash');
      loadData();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Move this folder to trash?')) return;

    try {
      await foldersAPI.delete(folderId);
      toast.success('Folder moved to trash');
      loadData();
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  const handleToggleStar = async (fileId) => {
    try {
      await filesAPI.toggleStar(fileId);
      loadData();
    } catch (error) {
      toast.error('Failed to star/unstar file');
    }
  };

  const handleDelete = (id, type) => {
    if (type === 'file') {
      handleDeleteFile(id);
    } else {
      handleDeleteFolder(id);
    }
  };

  const handlePreview = (fileId) => {
    const index = files.findIndex(f => f.id === fileId);
    setPreviewFileIndex(index);
    setPreviewFileId(fileId);
  };

  const handleNextPreview = () => {
    if (previewFileIndex < files.length - 1) {
      const nextIndex = previewFileIndex + 1;
      setPreviewFileIndex(nextIndex);
      setPreviewFileId(files[nextIndex].id);
    }
  };

  const handlePreviousPreview = () => {
    if (previewFileIndex > 0) {
      const prevIndex = previewFileIndex - 1;
      setPreviewFileIndex(prevIndex);
      setPreviewFileId(files[prevIndex].id);
    }
  };

  const handleClosePreview = () => {
    setPreviewFileId(null);
    setPreviewFileIndex(-1);
  };

  const handlePreviewToggleStar = async (fileId) => {
    await handleToggleStar(fileId);
  };

  const handleShare = (file) => {
    setShareModalItem(file);
    setShareModalType('file');
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage);
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

  const handleDeleteSelected = async () => {
    const totalSelected = selectedItems.files.length + selectedItems.folders.length;
    
    if (totalSelected === 0) {
      toast.error('No items selected');
      return;
    }

    if (!confirm(`Move ${totalSelected} selected item(s) to trash?`)) {
      return;
    }

    try {
      const filePromises = selectedItems.files.map(fileId => filesAPI.delete(fileId));
      const folderPromises = selectedItems.folders.map(folderId => foldersAPI.delete(folderId));

      await Promise.all([...filePromises, ...folderPromises]);

      toast.success(`${totalSelected} item(s) moved to trash`);
      setSelectionMode(false);
      setSelectedItems({ files: [], folders: [] });
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete some items');
    }
  };

  const isAllSelected = () => {
    return selectedItems.files.length === files.length && 
           selectedItems.folders.length === folders.length &&
           (files.length > 0 || folders.length > 0);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4">
          <AdvancedSearch onSearch={handleSearch} onClear={clearSearch} />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* <div className="flex items-center gap-2 mb-4 text-sm overflow-x-auto pb-2">
            <button
              onClick={() => {
                setCurrentFolder(null);
                setBreadcrumbs([]);
              }}
              className={`flex items-center gap-2 transition ${
                !currentFolder 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home size={16} />
              <span>My Drive</span>
            </button>
            
            {breadcrumbs.length > 0 && (
              <>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
                <div className="flex items-center gap-2">
                  <Folder size={16} className="text-blue-500 shrink-0" />
                  <span className="font-semibold text-gray-800 truncate max-w-md">
                    {breadcrumbs[0].name}
                  </span>
                </div>
              </>
            )}
          
            {isSearching && (
              <>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-600 italic">Search Results</span>
              </>
            )}
          </div> */}
          <Breadcrumbs
            breadcrumbs={breadcrumbs}
            onNavigate={handleBreadcrumbNavigate}
            isSearching={isSearching}
          />

          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {!selectionMode ? (
                  <>
                    <button
                      onClick={() => setShowCreateFolder(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      <FolderPlus size={20} />
                      New Folder
                    </button>

                    <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition cursor-pointer">
                      <Upload size={20} />
                      {uploading ? 'Uploading...' : 'Upload Files'}
                      <input
                        type="file"
                        multiple 
                        onChange={handleFileInputChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>

                    <button
                      onClick={() => setShowTagManager(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                    >
                      <TagIcon size={20} />
                      Manage Tags
                    </button>

                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      <CheckSquare size={20} />
                      Select
                    </button>
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
                      onClick={handleDeleteSelected}
                      disabled={selectedItems.files.length === 0 && selectedItems.folders.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={20} />
                      Delete ({selectedItems.files.length + selectedItems.folders.length})
                    </button>

                    <button
                      onClick={toggleSelectionMode}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      <X size={20} />
                      Cancel
                    </button>

                    <span className="text-sm text-gray-600">
                      {selectedItems.files.length + selectedItems.folders.length} item(s) selected
                    </span>
                  </>
                )}
              </div>

              <ViewToggle view={view} onViewChange={setView} />
            </div>

            {showCreateFolder && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Create New Folder</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateFolder(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`bg-white rounded-xl shadow-md p-6 transition ${
              dragActive ? 'border-4 border-dashed border-blue-500 bg-blue-50' : ''
            }`}
          >
            {dragActive && (
              <div className="text-center py-12">
                <Upload className="mx-auto text-blue-500 mb-4" size={64} />
                <p className="text-xl font-semibold text-blue-600">Drop files here to upload</p>
              </div>
            )}

            {!dragActive && (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {isSearching ? `Search Results${searchQuery ? ` for "${searchQuery}"` : ''}` : currentFolder ? 'Current Folder' : 'My Drive'}
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" text="Loading files..." />
                  </div>
                ) : (
                  <FileList
                    files={files}
                    folders={folders}
                    viewMode={view}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                    onFolderClick={handleFolderClick}
                    onPreview={handlePreview}
                    onShare={handleShare}
                    onEditTags={(file) => setTagEditorFile(file)}
                    isSearching={isSearching}
                    onVersionHistory={handleVersionHistory}
                    selectionMode={selectionMode}
                    selectedFiles={selectedItems.files}
                    selectedFolders={selectedItems.folders}
                    onToggleFileSelection={toggleFileSelection}
                    onToggleFolderSelection={toggleFolderSelection}
                  />
                )}
              </>
            )}
          </div>

          {!loading && hasMore && files.length > 0 && !isSearching && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Load More Files
              </button>
            </div>
          )}
        </div>
      </div>

      <UploadProgress uploads={uploads} onRemove={handleRemoveUpload} />

      {shareModalItem && (
        <ShareModal
          item={shareModalItem}
          itemType={shareModalType}
          onClose={() => {
            setShareModalItem(null);
            setShareModalType(null);
          }}
          onSuccess={() => {
            setShareModalItem(null);
            setShareModalType(null);
          }}
        />
      )}

      {previewFileId && (
        <FilePreviewModal
          fileId={previewFileId}
          onClose={handleClosePreview}
          onNext={handleNextPreview}
          onPrevious={handlePreviousPreview}
          hasNext={previewFileIndex < files.length - 1}
          hasPrevious={previewFileIndex > 0}
          onToggleStar={handlePreviewToggleStar}
        />
      )}

      {versionModalFile && (
        <VersionHistoryModal
          file={versionModalFile}
          onClose={() => setVersionModalFile(null)}
          onRestore={handleVersionRestore}
        />
      )}

      {showTagManager && (
        <TagManager
          onClose={() => setShowTagManager(false)}
          onTagsUpdated={loadData}
        />
      )}

      {tagEditorFile && (
        <FileTagEditor
          file={tagEditorFile}
          onClose={() => setTagEditorFile(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

export default Dashboard;