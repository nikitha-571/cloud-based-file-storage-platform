import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';
import { tagsAPI } from '../services/api';
import toast from 'react-hot-toast';

function TagManager({ onClose, onTagsUpdated }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' },
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const response = await tagsAPI.getAll();
      setTags(response.data);
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTag) {
        await tagsAPI.update(editingTag.id, formData);
        toast.success('Tag updated successfully');
      } else {
        await tagsAPI.create(formData);
        toast.success('Tag created successfully');
      }
      
      setFormData({ name: '', color: '#3B82F6' });
      setShowCreateForm(false);
      setEditingTag(null);
      loadTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save tag');
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setShowCreateForm(true);
  };

  const handleDelete = async (tagId) => {
    if (!confirm('Delete this tag? It will be removed from all files.')) return;
    
    try {
      await tagsAPI.delete(tagId);
      toast.success('Tag deleted');
      loadTags();
      if (onTagsUpdated) onTagsUpdated();
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTag(null);
    setFormData({ name: '', color: '#3B82F6' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Tag className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Manage Tags</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-4"
            >
              <Plus size={20} />
              Create New Tag
            </button>
          )}

          {/* Create/Edit Form */}
          {showCreateForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tag Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tag name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition ${
                        formData.color === color.value
                          ? 'border-gray-800 shadow-md'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTag ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Tags List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading tags...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tags yet. Create your first tag!
            </div>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TagManager;