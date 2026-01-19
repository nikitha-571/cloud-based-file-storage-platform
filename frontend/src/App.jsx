import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToastProvider from './components/ToastProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Starred from './pages/Starred';
import Trash from './pages/Trash';
import Shared from './pages/Shared';
import Activity from './pages/Activity';
import PublicLink from './pages/PublicLink';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleCallback from './pages/GoogleCallback'; // 

function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/starred" element={<Starred />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/shared" element={<Shared />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/public/:token" element={<PublicLink />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;