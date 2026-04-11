import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/projects" className="text-lg font-semibold text-blue-600 hover:text-blue-700">
          TaskFlow
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
