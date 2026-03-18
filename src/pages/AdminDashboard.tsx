import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, Key, Plus, Trash2, Copy, Check, RefreshCw, 
  Users, Ban, CheckCircle, Search, LogOut,
  Unlock, Download, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface MasterKey {
  id: string; key: string; name: string; created_at: string;
  is_active: boolean; max_devices: number; current_devices: number;
  usage_count: number; last_used: string | null;
}

interface AdminDashboardProps { onLogout: () => void; }

// Helper: all admin API calls use X-Admin-Key header
function adminFetch(url: string, adminKey: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { 'X-Admin-Key': adminKey, 'Content-Type': 'application/json', ...options.headers },
  });
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [keys, setKeys] = useState<MasterKey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDevices, setNewKeyDevices] = useState('3');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasChecked = useRef(false);

  const fetchKeys = useCallback(async (key: string) => {
    try {
      const res = await adminFetch(`${API_URL}/api/admin/keys`, key);
      if (res.ok) { const data = await res.json(); setKeys(data.keys || []); }
    } catch (e) { console.error('Fetch keys failed:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    const saved = localStorage.getItem('valiant_admin_key');
    if (saved) { setAdminKey(saved); setIsAuthenticated(true); fetchKeys(saved); }
    else setLoading(false);
  }, [fetchKeys]);

  const handleLogin = async () => {
    setLoading(true); setLoginError('');
    try {
      const res = await adminFetch(`${API_URL}/api/admin/verify`, adminKey);
      if (res.ok) { localStorage.setItem('valiant_admin_key', adminKey); setIsAuthenticated(true); await fetchKeys(adminKey); }
      else { setLoginError('Invalid admin key'); setLoading(false); }
    } catch { setLoginError('Network error'); setLoading(false); }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    const res = await adminFetch(`${API_URL}/api/admin/keys`, adminKey, {
      method: 'POST', body: JSON.stringify({ name: newKeyName, max_devices: parseInt(newKeyDevices) || 3 })
    });
    if (res.ok) { const data = await res.json(); setGeneratedKey(data.key); await fetchKeys(adminKey); }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this key?')) return;
    await adminFetch(`${API_URL}/api/admin/keys/${id}/revoke`, adminKey, { method: 'POST' });
    await fetchKeys(adminKey);
  };

  const reactivateKey = async (id: string) => {
    await adminFetch(`${API_URL}/api/admin/keys/${id}/reactivate`, adminKey, { method: 'POST' });
    await fetchKeys(adminKey);
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Permanently delete this key? Cannot undo.')) return;
    await adminFetch(`${API_URL}/api/admin/keys/${id}`, adminKey, { method: 'DELETE' });
    await fetchKeys(adminKey);
  };

  const exportKeys = async () => {
    const res = await adminFetch(`${API_URL}/api/admin/keys/export`, adminKey);
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `valbot-keys-${new Date().toISOString().slice(0, 10)}.json`;
      a.click(); URL.revokeObjectURL(a.href);
    }
  };

  const importKeys = async () => {
    try {
      let parsed: any;
      try { parsed = JSON.parse(importJson); } catch { setImportResult('Invalid JSON'); return; }
      const keysData = parsed.keys || parsed;
      if (!Array.isArray(keysData)) { setImportResult('Expected {keys: [...]}'); return; }
      const res = await adminFetch(`${API_URL}/api/admin/keys/import`, adminKey, {
        method: 'POST', body: JSON.stringify({ keys: keysData })
      });
      if (res.ok) {
        const data = await res.json();
        setImportResult(`Imported ${data.imported}, skipped ${data.skipped} dupes`);
        await fetchKeys(adminKey);
        setTimeout(() => { setShowImport(false); setImportJson(''); setImportResult(''); }, 3000);
      }
    } catch { setImportResult('Import failed'); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onload = (ev) => setImportJson(ev.target?.result as string); r.readAsText(file); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('valiant_admin_key');
    setAdminKey(''); setIsAuthenticated(false); onLogout();
  };

  const filteredKeys = keys.filter(k => {
    const s = k.name.toLowerCase().includes(searchTerm.toLowerCase()) || k.key.toLowerCase().includes(searchTerm.toLowerCase());
    const f = filterStatus === 'all' || (filterStatus === 'active' && k.is_active) || (filterStatus === 'revoked' && !k.is_active);
    return s && f;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-white/30 text-sm mt-1">ValBot Key Management</p>
          </div>
          <div className="space-y-4">
            <Input type="password" placeholder="Admin key" value={adminKey}
              onChange={e => setAdminKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="bg-white/5 border-white/10 text-white" />
            {loginError && <p className="text-red-400 text-xs">{loginError}</p>}
            <Button onClick={handleLogin} disabled={loading || !adminKey}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
              {loading ? 'Verifying...' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060608] pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-emerald-400" /> Key Management
            </h1>
            <p className="text-white/30 text-sm mt-1">{keys.length} keys · {keys.filter(k => k.is_active).length} active</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportKeys}
              className="border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/30">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowImport(!showImport)}
              className="border-white/10 text-white/60 hover:text-emerald-400 hover:border-emerald-500/30">
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" variant="outline" onClick={() => fetchKeys(adminKey)} className="border-white/10 text-white/60">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="text-white/40 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showImport && (
          <Card className="mb-6 bg-white/[0.03] border-white/10">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Import Keys from Backup</h3>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}
                  className="border-white/10 text-white/60 text-xs">Choose File</Button>
              </div>
              <textarea value={importJson} onChange={e => setImportJson(e.target.value)}
                placeholder='Paste backup JSON or upload file...'
                className="w-full h-32 bg-black/50 border border-white/10 rounded-lg p-3 text-white/80 text-xs font-mono resize-none" />
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={importKeys} disabled={!importJson}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">Import</Button>
                {importResult && <span className="text-emerald-400 text-xs">{importResult}</span>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 bg-white/[0.03] border-white/10">
          <CardContent className="p-5">
            {!showCreate && !generatedKey ? (
              <Button onClick={() => setShowCreate(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="w-4 h-4 mr-1" /> Create New Key
              </Button>
            ) : generatedKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4" /> Key created!</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/50 px-4 py-3 rounded-lg text-emerald-400 font-mono text-sm border border-emerald-500/20">{generatedKey}</code>
                  <Button size="sm" onClick={() => copyToClipboard(generatedKey)} className={copiedKey ? 'bg-emerald-600' : 'bg-white/10'}>
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-white/30 text-xs">Save now — won't be shown in full again.</p>
                <Button size="sm" variant="outline" onClick={() => { setGeneratedKey(''); setShowCreate(false); setNewKeyName(''); }}
                  className="border-white/10 text-white/60">Done</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-white/50 text-xs">Key Name</Label>
                    <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Phone, Laptop"
                      className="bg-black/50 border-white/10 text-white text-sm mt-1" /></div>
                  <div><Label className="text-white/50 text-xs">Max Devices</Label>
                    <Input type="number" value={newKeyDevices} onChange={e => setNewKeyDevices(e.target.value)}
                      className="bg-black/50 border-white/10 text-white text-sm mt-1" /></div>
                </div>
                <p className="text-white/20 text-xs">Keys are permanent — no expiry. Delete manually when no longer needed.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={createKey} disabled={!newKeyName.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">Create</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCreate(false)} className="border-white/10 text-white/60">Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search keys..."
              className="pl-9 bg-white/[0.03] border-white/10 text-white text-sm" />
          </div>
          <div className="flex gap-1">
            {(['all', 'active', 'revoked'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={cn('px-3 py-1.5 text-xs rounded-lg transition-colors capitalize',
                  filterStatus === f ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-white/60')}>{f}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredKeys.length === 0 ? (
            <div className="text-center py-12 text-white/20 text-sm">{keys.length === 0 ? 'No keys yet' : 'No match'}</div>
          ) : filteredKeys.map(k => (
            <div key={k.id} className={cn('flex items-center gap-4 p-4 rounded-xl border transition-colors',
              k.is_active ? 'bg-white/[0.02] border-white/[0.06] hover:border-emerald-500/20' : 'bg-white/[0.01] border-white/[0.03] opacity-60')}>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
                k.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20')}>
                <Key className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{k.name}</span>
                  <Badge className={cn('text-[10px] px-1.5 py-0',
                    k.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                    {k.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-white/25">
                  <span className="font-mono">{k.key}</span>
                  <span>·</span>
                  <span><Users className="w-3 h-3 inline mr-0.5" />{k.current_devices}/{k.max_devices}</span>
                  <span>·</span>
                  <span>{k.usage_count} uses</span>
                  {k.last_used && <><span>·</span><span>Last: {new Date(k.last_used).toLocaleDateString()}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {k.is_active ? (
                  <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)} className="text-white/20 hover:text-yellow-400 h-8 w-8 p-0">
                    <Ban className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => reactivateKey(k.id)} className="text-white/20 hover:text-emerald-400 h-8 w-8 p-0">
                    <Unlock className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteKey(k.id)} className="text-white/20 hover:text-red-400 h-8 w-8 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
