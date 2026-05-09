'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${data.user.name}`,
          timer: 1500,
          showConfirmButton: false,
          background: '#1a1d21',
          color: '#fff',
        });
        router.push('/dashboard');
      } else {
        throw new Error(data.error || 'Login gagal');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error.message,
        background: '#1a1d21',
        color: '#fff',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1113] p-4 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,102,255,0.1),_transparent_50%)]"></div>

      <div className="w-full max-w-md relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="bg-[#1a1d21]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
              <span className="text-2xl font-bold text-white">JF</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">JARFI MGT</h1>
            <p className="text-gray-400">Silakan login untuk mengelola jaringan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Email / Username</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { e.target.setCustomValidity(''); setEmail(e.target.value); }}
                className="w-full bg-[#0f1113] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-gray-600"
                placeholder="admin@jarfi.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f1113] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-600/20 ${loading
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-sm text-gray-500">
              ISP Management System v0.1.0 by Supriyanto<br/>
              &copy; {new Date().getFullYear()} JARFI Industrial Network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
