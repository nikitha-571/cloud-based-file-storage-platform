import { useState, useEffect } from 'react';
import { X, RotateCcw, Clock, Check, AlertCircle } from 'lucide-react';
import { versionsAPI } from '../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

function VersionHistoryModal({ file, onClose, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [file.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const response = await versionsAPI.getFileVersions(file.id);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNumber) => {
    if (!confirm(`Restore file to version ${versionNumber}? This will create a new version.`)) {
      return;
    }

    setRestoring(versionNumber);
    try {
      await versionsAPI.restoreVersion(file.id, versionNumber);
      toast.success(`File restored to version ${versionNumber}`);
      
      await loadVersions();
      if (onRestore) onRestore();
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold">Version History</h2>
              <p className="text-sm text-gray-600">{file.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading versions..." />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 ${
                    index === 0
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          Version {version.version_number}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                            <Check size={12} />
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(version.created_at)}
                        </span>
                        <span>{formatFileSize(version.file_size)}</span>
                      </div>
                    </div>

                    {index > 0 && (
                      <button
                        onClick={() => handleRestore(version.version_number)}
                        disabled={restoring === version.version_number}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-green-300"
                      >
                        {restoring === version.version_number ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={16} />
                            Restore
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600 text-center">
            {/* 💡 Restoring a version creates a new version with the old content */}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VersionHistoryModal;