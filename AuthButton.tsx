import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { UserAtom, AuthLoadingAtom } from './atoms';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, User } from 'lucide-react';

export function AuthButton() {
  const [user, setUser] = useAtom(UserAtom);
  const [loading, setLoading] = useAtom(AuthLoadingAtom);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  const handleLogin = async () => {
    if (!auth) {
      console.error('Firebase is not configured. Please check your environment variables.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  if (loading) {
    return <div className="text-[10px] text-[var(--text-color-secondary)] font-bold uppercase tracking-wider">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-[var(--bg-color-secondary)] border border-[var(--border-color)] rounded-full pr-3 pl-1 py-1 shadow-sm">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full border border-[var(--border-color)]" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-[var(--bg-color)] text-xs font-bold">
            {user.email?.charAt(0).toUpperCase() || <User size={14} />}
          </div>
        )}
        <span className="text-[10px] font-bold text-[var(--text-color-primary)] max-w-[80px] truncate">
          {user.displayName || user.email}
        </span>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-500 hover:text-red-600 ml-1 transition-colors"
          title="Sign Out"
        >
          <LogOut size={12} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin} 
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-color)] hover:opacity-90 text-[var(--bg-color)] rounded-md text-xs font-medium transition-all shadow-sm"
    >
      <LogIn size={14} />
      Sign In
    </button>
  );
}
