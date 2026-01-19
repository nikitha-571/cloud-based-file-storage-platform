import { useState, useEffect } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { tagsAPI } from '../services/api';
import toast from 'react-hot-toast';

function FileTagEditor({ file, onClose, onUpdate }) {
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
      
      if (file.tags) {
        setSelectedTags(file.tags.map(t => t.id));
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    try {
      await tagsAPI.addToFile(file.id, selectedTags);
      toast.success('Tags updated successfully');
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to update tags');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Tag className="text-blue-600" size={20} />
            <h3 className="font-semibold">Edit Tags</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Select tags for <span className="font-medium">{file.name}</span>
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading tags...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tags available. Create tags first!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    {isSelected && <Check className="text-blue-600" size={20} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Tags
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileTagEditor;