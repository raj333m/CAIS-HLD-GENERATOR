'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Database,
  Building2,
  Users,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Save,
  Trash2,
  Sparkles,
} from 'lucide-react';

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'bureaus' | 'users'>('catalog');

  // Catalog State
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newCategory, setNewCategory] = useState('Account Identification');
  const [newDesc, setNewDesc] = useState('');
  const [newDef, setNewDef] = useState('');

  // Bureau State
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [editingBureau, setEditingBureau] = useState<any>(null);

  // User State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'BA' | 'REVIEWER' | 'ADMIN'>('BA');

  const fetchCatalog = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch('/api/cais-items');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchBureaus = async () => {
    try {
      const res = await fetch('/api/bureaus');
      if (res.ok) {
        const data = await res.json();
        setBureaus(data.bureaus || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCatalog();
    fetchBureaus();
    fetchUsers();
  }, []);

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cais-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCode: newItemCode,
          itemName: newItemName,
          category: newCategory,
          description: newDesc,
          currentDefinition: newDef,
        }),
      });
      if (res.ok) {
        setShowAddItem(false);
        setNewItemCode('');
        setNewItemName('');
        setNewDesc('');
        setNewDef('');
        fetchCatalog();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBureau = async (bureauObj: any) => {
    try {
      const res = await fetch('/api/bureaus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bureauObj),
      });
      if (res.ok) {
        setEditingBureau(null);
        fetchBureaus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
        }),
      });
      if (res.ok) {
        setShowAddUser(false);
        setUserName('');
        setUserEmail('');
        setUserPassword('');
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-md mx-auto my-12">
        <Shield className="w-12 h-12 text-amber-400 mx-auto" />
        <div className="text-lg font-bold text-white">Admin Access Restricted</div>
        <p className="text-xs text-slate-400">
          You are currently signed in as {user?.role}. Switch role to <strong className="text-amber-400">ADMIN</strong> in the top navbar to access Master Data management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Master Data Management</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Manage CAIS Data Item Catalog, Credit Bureau Specifications, and User Accounts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" /> CAIS Catalog ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('bureaus')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'bureaus' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Bureaus ({bureaus.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Users ({usersList.length})
          </button>
        </div>
      </div>

      {/* TAB 1: CAIS DATA CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center glass-card p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Maintained CAIS Data Items
            </span>
            <button
              onClick={() => setShowAddItem(!showAddItem)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-500"
            >
              <Plus className="w-4 h-4" /> Add Catalog Item
            </button>
          </div>

          {showAddItem && (
            <form onSubmit={handleCreateCatalogItem} className="glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-4">
              <div className="text-xs font-bold text-blue-300">Add New Master CAIS Data Item</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Item Code (e.g. ARR_INDICATOR)"
                  value={newItemCode}
                  onChange={(e) => setNewItemCode(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Item Name (e.g. Arrangement Indicator)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="Account Identification">Account Identification</option>
                  <option value="Balance & Limit">Balance & Limit</option>
                  <option value="Status & Arrears">Status & Arrears</option>
                  <option value="Default & Recovery">Default & Recovery</option>
                  <option value="Special Flags">Special Flags</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Short Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Current Definition / Format Notes"
                  value={newDef}
                  onChange={(e) => setNewDef(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">
                  Save Item
                </button>
                <button type="button" onClick={() => setShowAddItem(false)} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Current Definition</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.itemName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{item.currentDefinition}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BUREAUS MASTER LIST */}
      {activeTab === 'bureaus' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bureaus.map((b) => {
            const isEditing = editingBureau?.id === b.id;
            const currentB = isEditing ? editingBureau : b;

            return (
              <div key={b.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-base text-amber-300">{currentB.name}</span>
                    <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {currentB.fileSpecVersion}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="text-slate-400">Submission Channel</label>
                        <input
                          type="text"
                          value={currentB.submissionChannel}
                          onChange={(e) => setEditingBureau({ ...currentB, submissionChannel: e.target.value })}
                          className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400">File Format</label>
                        <input
                          type="text"
                          value={currentB.fileFormat}
                          onChange={(e) => setEditingBureau({ ...currentB, fileFormat: e.target.value })}
                          className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400">Cutoff Date</label>
                        <input
                          type="text"
                          value={currentB.cutoffDate}
                          onChange={(e) => setEditingBureau({ ...currentB, cutoffDate: e.target.value })}
                          className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400">Spec Version</label>
                        <input
                          type="text"
                          value={currentB.fileSpecVersion}
                          onChange={(e) => setEditingBureau({ ...currentB, fileSpecVersion: e.target.value })}
                          className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Channel:</span>
                        <span>{b.submissionChannel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Format:</span>
                        <span>{b.fileFormat}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cutoff Date:</span>
                        <span>{b.cutoffDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Notes:</span>
                        <span className="text-slate-400 italic">{b.notes}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateBureau(editingBureau)}
                        className="w-full py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg"
                      >
                        Save Spec
                      </button>
                      <button
                        onClick={() => setEditingBureau(null)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingBureau({ ...b })}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Master Spec
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center glass-card p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Application User Accounts
            </span>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-500"
            >
              <Plus className="w-4 h-4" /> Add User Account
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleCreateUser} className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
              <div className="text-xs font-bold text-purple-300">Create New User</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                >
                  <option value="BA">BA (Author)</option>
                  <option value="REVIEWER">Reviewer / Approver</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold">
                  Create User
                </button>
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="p-3 text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'REVIEWER'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
