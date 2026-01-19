import { useState, useEffect } from 'react';
import { 
  Upload, Trash2, RotateCcw, Share2, Clock, 
  File, Folder, Star, Download, RefreshCw, X, CheckSquare, Square
} from 'lucide-react';
import { activitiesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

function ActivityFeed({ limit = 50 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await activitiesAPI.getUserActivities(limit);
      setActivities(response.data);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`Delete all ${activities.length} activities? This cannot be undone!`)) {
      return;
    }

    try {
      const response = await activitiesAPI.clearAll();
      toast.success(response.data.message);
      loadActivities();
    } catch (error) {
      console.error('Failed to clear activities:', error);
      toast.error('Failed to clear activities');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('No activities selected');
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} selected activities?`)) {
      return;
    }

    try {
      const response = await activitiesAPI.bulkDelete(selectedIds);
      toast.success(response.data.message);
      loadActivities();
    } catch (error) {
      console.error('Failed to delete activities:', error);
      toast.error('Failed to delete activities');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activities.map(a => a.id));
    }
  };

  const getActivityIcon = (activityType) => {
    const iconMap = {
      upload: <Upload size={16} className="text-blue-500" />,
      delete: <Trash2 size={16} className="text-red-500" />,
      restore: <RotateCcw size={16} className="text-green-500" />,
      share: <Share2 size={16} className="text-purple-500" />,
      unshare: <Share2 size={16} className="text-gray-500" />,
      download: <Download size={16} className="text-indigo-500" />,
      version_upload: <Upload size={16} className="text-blue-500" />,
      version_restore: <RotateCcw size={16} className="text-green-500" />,
    };
    return iconMap[activityType] || <File size={16} className="text-gray-400" />;
  };

  const getActivityText = (activity) => {
    const actionMap = {
      upload: 'uploaded',
      delete: 'deleted',
      restore: 'restored',
      share: 'shared',
      unshare: 'unshared',
      download: 'downloaded',
      version_upload: 'uploaded new version of',
      version_restore: 'restored version of',
    };
    
    const action = actionMap[activity.activity_type] || activity.activity_type;
    const resourceIcon = activity.resource_type === 'file' 
      ? <File size={14} className="inline" />
      : <Folder size={14} className="inline" />;

    return (
      <span className="text-sm">
        You <span className="font-medium">{action}</span>{' '}
        {resourceIcon} <span className="font-medium">{activity.resource_name}</span>
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" text="Loading activities..." />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-sm text-gray-400 mt-2">
          Your actions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {!selectionMode ? (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <CheckSquare size={16} />
                Select
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                {selectedIds.length === activities.length ? (
                  <>
                    <CheckSquare size={16} />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square size={16} />
                    Select All
                  </>
                )}
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                Delete ({selectedIds.length})
              </button>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds([]);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={16} />
                Cancel
              </button>
            </>
          )}
        </div>

        <button
          onClick={loadActivities}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`flex items-start gap-3 p-3 rounded-lg transition group ${
            selectionMode ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
          } ${selectedIds.includes(activity.id) ? 'bg-blue-50 border-2 border-blue-300' : ''}`}
        >
          {selectionMode && (
            <button
              onClick={() => toggleSelection(activity.id)}
              className="shrink-0 mt-1"
            >
              {selectedIds.includes(activity.id) ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} className="text-gray-400" />
              )}
            </button>
          )}

          <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
            {getActivityIcon(activity.activity_type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {getActivityText(activity)}
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {formatTimeAgo(activity.created_at)}
              </span>
            </div>

            {activity.details && (
              <div className="text-xs text-gray-500 mt-1">
                {JSON.parse(activity.details).file_size && (
                  <span>
                    {(JSON.parse(activity.details).file_size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {activities.length >= limit && (
        <button
          onClick={() => loadActivities()}
          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          Load more
        </button>
      )}
    </div>
  );
}

export default ActivityFeed;