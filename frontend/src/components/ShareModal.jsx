import { useState } from 'react';
import { X, Users, Link, Copy, Check } from 'lucide-react';
import { sharesAPI } from '../services/api';
import toast from 'react-hot-toast';

function ShareModal({ item, itemType, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('users');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [publicLink, setPublicLink] = useState(null);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShareWithUser = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const fileId = itemType === 'file' ? item.id : null;
      const folderId = itemType === 'folder' ? item.id : null;
      
      await sharesAPI.createShare(fileId, folderId, email, role);
      toast.success(`Shared with ${email} as ${role}`);
      setEmail('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error.response?.data?.detail || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePublicLink = async (e) => {
    e.preventDefault();
    
    if (itemType !== 'file') {
      toast.error('Public links are only available for files');
      return;
    }

    setLoading(true);
    try {
      const response = await sharesAPI.createPublicLink(
        item.id,
        linkPassword || null,
        linkExpiry ? parseInt(linkExpiry) : null
      );
      setPublicLink(response.data.public_url);
      toast.success('Public link created successfully!');
    } catch (error) {
      console.error('Public link error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create public link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Share "{item?.name}"
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {itemType === 'file' ? 'File' : 'Folder'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={18} />
            Share with Users
          </button>
          {itemType === 'file' && (
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
                activeTab === 'link'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Link size={18} />
              Public Link
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'users' ? (
            <div>
              <form onSubmit={handleShareWithUser}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Permission
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={loading}
                  >
                    <option value="viewer">Viewer (Can view only)</option>
                    <option value="editor">Editor (Can edit and delete)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-md font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </form>
            </div>
          ) : (
            <div>
              {!publicLink ? (
                <form onSubmit={handleCreatePublicLink}>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a public link that anyone can use to access this file.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password (Optional)
                    </label>
                    <input
                      type="text"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="Leave empty for no password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Expires in (days)
                    </label>
                    <input
                      type="number"
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                      placeholder="Leave empty for no expiry"
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2.5 rounded-md font-medium hover:bg-green-700 transition disabled:bg-green-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Public Link'}
                  </button>
                </form>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Your public link is ready! Anyone with this link can access the file.
                  </p>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={publicLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                    >
                      {copied ? (
                        <>
                          <Check size={16} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copy
                        </>
                      )}
                    </button>
                  </div>

                  {linkPassword && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Password:</strong> {linkPassword}
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Share this password separately with recipients.
                      </p>
                    </div>
                  )}

                  {linkExpiry && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        Link expires in {linkExpiry} days
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPublicLink(null);
                      setLinkPassword('');
                      setLinkExpiry('');
                    }}
                    className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-md font-medium hover:bg-gray-300 transition"
                  >
                    Create New Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;