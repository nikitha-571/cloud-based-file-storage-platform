import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity as ActivityIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ActivityFeed from '../components/ActivityFeed';

function Activity() {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    
    if (!token) {
      navigate('/login');
    } else {
      setUserEmail(email);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_picture');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={userEmail} onLogout={handleLogout} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <ActivityIcon className="text-blue-600" size={32} />
              <div>
                <h2 className="text-2xl font-bold">Recent Activity</h2>
                <p className="text-sm text-gray-600">Your recent actions and events</p>
              </div>
            </div>

            <ActivityFeed limit={50} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Activity;