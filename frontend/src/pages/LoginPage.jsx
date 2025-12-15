import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { Terminal, Mail, Lock, Github, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Both username and password are required.');
      return;
    }
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/learning');
    } catch (err) {
      setError(err.message || 'Unable to login. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark relative overflow-hidden flex items-center justify-center p-4">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />

      {/* Animated Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-blue/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-purple/10 blur-[120px] animate-pulse-slow" />

      {/* Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-12 h-12 bg-primary-blue/20 rounded-xl flex items-center justify-center border border-primary-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4">
              <Terminal className="w-6 h-6 text-primary-blue" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">CodeForge</h1>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
            <p className="text-sm text-slate-400">Enter your credentials to access the forge.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email or Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-blue transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="engineer@codeforge.dev"
                  className="glass-input pl-11"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <a href="#" className="text-xs font-medium text-primary-blue hover:text-blue-400 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-blue transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="glass-input pl-11"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card-surface px-3 text-slate-500 font-medium tracking-wide">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all active:scale-[0.98]">
              <Github size={18} />
              <span>GitHub</span>
            </button>
            <button className="flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>Google</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-blue font-medium hover:text-blue-400 transition-colors">
              Apply for access
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
