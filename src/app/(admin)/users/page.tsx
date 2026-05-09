'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, UserPlus, Shield, Trash2, Mail, 
  User as UserIcon, Search, ChevronRight, Home, 
  ChevronLeft, Edit2, Filter
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEKNISI',
  });

  const roles = ['SUPERADMIN', 'ADMIN', 'KASIR', 'TEKNISI', 'PELANGGAN'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and Paginated Users logic moved before return for clarity
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length,
    teknisi: users.filter(u => u.role === 'TEKNISI').length,
    kasir: users.filter(u => u.role === 'KASIR').length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        Swal.fire('Berhasil!', 'User baru telah ditambahkan.', 'success');
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', role: 'TEKNISI' });
        fetchUsers();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menambah user');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus User?',
      text: "Tindakan ini tidak bisa dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      background: '#1a1d21',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          Swal.fire('Terhapus!', 'User telah dihapus.', 'success');
          fetchUsers();
        }
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus user', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <Home className="w-3 h-3" />
        <ChevronRight className="w-3 h-3" />
        <span>PENGATURAN</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-accent">KELOLA USER</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">
              Manajemen <span className="text-accent">User</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 opacity-70">
              Kelola hak akses petugas operator dan administrator sistem.
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-3 bg-accent hover:bg-accent/80 text-white px-6 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User Baru
          </button>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex items-center gap-3">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total: {stats.total}</span>
          </div>
          <div className="px-4 py-2 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-center gap-3">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Admin: {stats.admin}</span>
          </div>
          <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Teknisi: {stats.teknisi}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="CARI USER BERDASARKAN NAMA ATAU EMAIL..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl pl-12 pr-4 py-2.5 text-[11px] font-bold text-slate-700 dark:text-white focus:outline-none focus:border-accent/50 transition-all uppercase tracking-wider"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:text-accent transition-all active:scale-95">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
          </button>
        </div>
      </div>

      <div className="glass rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 shadow-xl bg-white dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Profil</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Identitas</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Peran (Role)</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-3 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Mensinkronisasi Data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-accent font-black border border-slate-200 dark:border-white/10 group-hover:border-accent/30 transition-all shadow-inner overflow-hidden">
                        {(u.avatar) ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">{u.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col min-w-0">
                        <p className="font-black text-slate-800 dark:text-white text-[12px] uppercase tracking-tight">{u.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate italic">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${
                        u.role === 'SUPERADMIN' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                        u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        u.role === 'TEKNISI' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        u.role === 'KASIR' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-accent hover:border-accent/30 border border-transparent transition-all active:scale-90 flex items-center justify-center">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all active:scale-90 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} Petugas
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-accent disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === page 
                    ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-accent'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-accent disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="bg-[#1a1d21] w-full max-w-lg rounded-[40px] border border-white/10 p-10 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-white uppercase italic mb-8">Tambah <span className="text-accent">User</span> Baru</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent transition-all"
                  placeholder="Contoh: Andi Teknisi"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email / Login</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent transition-all"
                  placeholder="andi@jarfi.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Password</label>
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Hak Akses (Role)</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-accent transition-all appearance-none"
                >
                  {roles.map(role => (
                    <option key={role} value={role} className="bg-[#1a1d21]">{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-accent text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-accent/20 active:scale-95"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
