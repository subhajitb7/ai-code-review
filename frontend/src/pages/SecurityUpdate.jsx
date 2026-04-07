import { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Lock, CheckCircle, ArrowRight } from 'lucide-react';

const SecurityUpdate = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // If user is not logged in or doesn't need update, redirect
  useEffect(() => {
    if (!user) navigate('/auth');
    if (user && !user.mustUpdatePassword) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be 6-8 characters with Uppercase, Lowercase, Number & Symbol');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Use the profile update endpoint or a dedicated one. 
      // Let's assume we can use a dedicated reset or profile update.
      // Since we need to clear the mustUpdatePassword flag, let's use a specific endpoint.
      const { data } = await axios.put('/api/auth/profile/upgrade-password', { newPassword });
      
      // Update local user state
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setSuccess(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,8}$/.test(newPassword);

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="glass-panel w-full max-w-md p-8 z-10 text-center shadow-2xl border-emerald-500/20">
          <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-main">Security Upgraded!</h2>
          <p className="text-sec font-medium mb-8">Your account is now protected by our new security standards. Redirecting you to the command center...</p>
          <div className="flex justify-center">
            <div className="h-1 w-24 bg-dark-600 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 z-10 shadow-2xl border-primary-500/20">
        <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-2 text-main italic tracking-tight">Security Upgrade</h2>
        <p className="text-sec font-medium text-center mb-8 leading-relaxed">
          We've introduced new security standards to keep your code safe. Please update your password to continue.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-black text-sec uppercase tracking-widest opacity-60">New Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                className="glass-input pl-11" 
                placeholder="••••••••" 
              />
            </div>
            
            {newPassword && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { label: '6-8 Chars', met: newPassword.length >= 6 && newPassword.length <= 8 },
                  { label: 'Uppercase', met: /[A-Z]/.test(newPassword) },
                  { label: 'Lowercase', met: /[a-z]/.test(newPassword) },
                  { label: 'Number', met: /\d/.test(newPassword) },
                  { label: 'Symbol', met: /[@$!%*?&]/.test(newPassword) },
                ].map((req) => (
                  <span 
                    key={req.label} 
                    className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded border transition-colors ${
                      req.met 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                        : 'bg-red-500/5 text-red-500/30 border-red-500/10'
                    }`}
                  >
                    {req.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-black text-sec uppercase tracking-widest opacity-60">Confirm New Password</label>
            <div className="relative">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sec" />
               <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="glass-input pl-11" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !isPasswordValid || newPassword !== confirmPassword} 
            className="btn-primary mt-4 flex items-center justify-center gap-2 py-4 shadow-lg shadow-primary-500/20 disabled:grayscale disabled:opacity-50"
          >
            {loading ? 'Upgrading...' : 'Upgrade Security'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <button 
          onClick={logout}
          className="mt-8 text-xs text-sec font-black uppercase tracking-widest hover:text-main transition-colors mx-auto block"
        >
          Logout and Update Later
        </button>
      </div>
    </div>
  );
};

export default SecurityUpdate;
