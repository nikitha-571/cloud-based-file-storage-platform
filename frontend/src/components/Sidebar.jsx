import { Home, Star, Trash2, Users, LogOut, HardDrive, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { filesAPI } from '../services/api';

function Sidebar({ userEmail, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userPicture, setUserPicture] = useState(null);
  const [userName, setUserName] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false); 
  const [imageError, setImageError] = useState(false);    
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(5 * 1024 * 1024 * 1024);

  useEffect(() => {
    const picture = localStorage.getItem('user_picture');
    const name = localStorage.getItem('user_name');
    
    if (picture) {
      setUserPicture(picture);
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = picture;
    } else {
      setImageLoaded(true);
    }
    
    if (name) setUserName(name);

    calculateStorage();
  }, []);

  const calculateStorage = async () => {
    try {
      const response = await filesAPI.getAll();
      const files = response.data;
      const totalBytes = files.reduce((sum, file) => sum + (file.file_size || 0), 0);
      setStorageUsed(totalBytes);
    } catch (error) {
      console.error('Failed to calculate storage:', error);
    }
  };

  const formatStorageSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const menuItems = [
    { icon: Home, label: 'My Drive', path: '/dashboard' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Trash2, label: 'Trash', path: '/trash' },
    { icon: Users, label: 'Shared', path: '/shared' },
    { icon: Activity, label: 'Activity', path: '/activity' },
  ];

  const isActive = (path) => location.pathname === path;

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return userEmail ? userEmail[0].toUpperCase() : 'U';
  };

  const storagePercentage = Math.round((storageUsed / storageTotal) * 100);
  const storageColor = storagePercentage > 90 ? 'bg-red-600' : 
                       storagePercentage > 75 ? 'bg-yellow-600' : 
                       'bg-blue-600';

  return (
    <div className="w-64 bg-white h-screen shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Cloud Storage</h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                isActive(item.path)
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Storage Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Storage</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`${storageColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-600">
            {formatStorageSize(storageUsed)} of {formatStorageSize(storageTotal)} used
          </p>
          
          {storagePercentage > 90 && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              ⚠️ Storage almost full!
            </p>
          )}
          
          {storagePercentage > 75 && storagePercentage <= 90 && (
            <p className="text-xs text-yellow-600 mt-1">
              Consider cleaning up files
            </p>
          )}
        </div>
      </div>

      {/* User Info & Logout  LOGIC */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
              {getInitials()}
            </div>
            
            {userPicture && !imageError && (
              <img
                src={userPicture}
                alt="Profile"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`absolute inset-0 w-10 h-10 rounded-full border-2 border-gray-200 transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {userName && (
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            )}
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;