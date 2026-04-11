import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError]     = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');

    const errors: Record<string, string> = {};
    if (!name.trim())         errors.name     = 'Name is required';
    if (!email.trim())        errors.email    = 'Email is required';
    else if (!email.includes('@')) errors.email = 'Enter a valid email';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/projects');
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, id: string, type: string, value: string, onChange: (v: string) => void, placeholder: string, autoComplete?: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          fieldErrors[id] ? 'border-red-400' : 'border-slate-300'
        }`}
        placeholder={placeholder}
      />
      {fieldErrors[id] && <p className="text-xs text-red-600 mt-1">{fieldErrors[id]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">TaskFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {field('Name', 'name', 'text', name, setName, 'Jane Doe', 'name')}
          {field('Email', 'email', 'email', email, setEmail, 'you@example.com', 'email')}
          {field('Password', 'password', 'password', password, setPassword, '8+ characters', 'new-password')}

          {formError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
