import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, Key, Plus, Trash2, Copy, Check, RefreshCw, 
  Users, Ban, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Search, LogOut,
  Lock, Unlock, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.dev';

interface MasterKey {
  id: string;
  key: string;
  name: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  max_devices: number;
  current_devices: number;
  usage_count: number;
  last_used: string | null;
  permissions: string[];
  created_by: string;
}

interface AuthStats {
  total_keys: number;
  active_keys: number;
  revoked_keys: number;
  total_sessions: number;
  active_sessions: number;
  failed_attempts_24h: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

// Generate device fingerprint for admin
const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '',
    (navigator as any).deviceMemory?.toString() || '',
  ];
  
  const data = components.join('|');
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [keys, setKeys] = useState<MasterKey[]>([]);
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('30');
  const [newKeyMaxDevices, setNewKeyMaxDevices] = useState('1');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'revoked'>('all');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  
  // Admin auth state - kept in memory only, not localStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(''); // Stored in memory only
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [deviceId, setDeviceId] = useState('');
  
  const hasCheckedLock = useRef(false);

  // Check lock status on mount
  useEffect(() => {
    if (hasCheckedLock.current) return;
    hasCheckedLock.current = true;
    
    const checkLock = async () => {
      const fingerprint = await generateDeviceFingerprint();
      setDeviceId(fingerprint.slice(0, 16));
      
      const lockUntil = localStorage.getItem('valiant_admin_lock_until');
      if (lockUntil) {
        const lockTime = parseInt(lockUntil);
        if (Date.now() < lockTime) {
          setIsLocked(true);
          setLockTimeLeft(Math.ceil((lockTime - Date.now()) / 1000));
        } else {
          localStorage.removeItem('valiant_admin_lock_until');
          localStorage.removeItem('valiant_admin_attempts');
        }
      }
      
      const savedAttempts = localStorage.getItem('valiant_admin_attempts');
      if (savedAttempts) {
        setAttempts(parseInt(savedAttempts));
      }
      
      setLoading(false);
    };
    
    checkLock();
  }, []);

  // Lock countdown
  useEffect(() => {
    if (!isLocked || lockTimeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setLockTimeLeft(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          localStorage.removeItem('valiant_admin_lock_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeLeft]);

  // Fetch data - admin_key in POST body, not URL
  const fetchData = useCallback(async (key: string) => {
    try {
      setLoading(true);
      const [keysRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/keys`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_key: key })
        }),
        fetch(`${API_URL}/api/admin/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_key: key })
        })
      ]);

      if (keysRes.ok && statsRes.ok) {
        const keysData = await keysRes.json();
        const statsData = await statsRes.json();
        setKeys(keysData.keys);
        setStats(statsData);
      } else {
        // Invalid admin key
        setIsAdminAuthenticated(false);
        setAdminKey('');
        setLoginError('Session expired. Please login again.');
      }
    } catch (e) {
      console.error('Failed to fetch data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin login with brute force protection
  const handleAdminLogin = async () => {
    if (isLocked || !adminKeyInput.trim()) return;
    
    setLoginError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          admin_key: adminKeyInput,
          device_fingerprint: deviceId
        })
      });
      
      if (response.ok) {
        // Success - store in memory only, not localStorage
        setAdminKey(adminKeyInput);
        setIsAdminAuthenticated(true);
        setAttempts(0);
        localStorage.removeItem('valiant_admin_attempts');
        await fetchData(adminKeyInput);
      } else {
        // Failed
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('valiant_admin_attempts', newAttempts.toString());
        
        if (response.status === 429 || newAttempts >= 5) {
          const lockUntil = Date.now() + 5 * 60 * 1000;
          localStorage.setItem('valiant_admin_lock_until', lockUntil.toString());
          setIsLocked(true);
          setLockTimeLeft(5 * 60);
          setLoginError('Too many failed attempts. Locked for 5 minutes.');
        } else {
          setLoginError(`Invalid admin key. ${5 - newAttempts} attempts remaining.`);
        }
      }
    } catch (e) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create key - admin_key in body
  const createKey = async () => {
    if (!newKeyName.trim() || !adminKey) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_key: adminKey,
          name: newKeyName,
          expires_days: parseInt(newKeyExpiry) || null,
          max_devices: parseInt(newKeyMaxDevices) || 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.key);
        await fetchData(adminKey);
      }
    } catch (e) {
      console.error('Failed to create key:', e);
    }
  };

  // Revoke key - admin_key in body
  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this key?') || !adminKey) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_key: adminKey })
      });

      if (response.ok) {
        await fetchData(adminKey);
      }
    } catch (e) {
      console.error('Failed to revoke key:', e);
    }
  };

  // Reactivate key - admin_key in body
  const reactivateKey = async (keyId: string) => {
    if (!adminKey) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/keys/${keyId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_key: adminKey })
      });

      if (response.ok) {
        await fetchData(adminKey);
      }
    } catch (e) {
      console.error('Failed to reactivate key:', e);
    }
  };

  // Delete key - admin_key in body
  const deleteKey = async (keyId: string) => {
    if (!confirm('Permanently delete this key? This cannot be undone.') || !adminKey) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/keys/${keyId}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_key: adminKey })
      });

      if (response.ok) {
        await fetchData(adminKey);
      }
    } catch (e) {
      console.error('Failed to delete key:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAdminLogout = () => {
    setAdminKey('');
    setIsAdminAuthenticated(false);
    setKeys([]);
    setStats(null);
    onLogout();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredKeys = keys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && key.is_active) ||
                         (filterStatus === 'revoked' && !key.is_active);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Admin Login Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] flex items-center justify-center p-4">
        {/* Hidden fake inputs to trick browser password managers */}
        <input type="text" name="username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        <input type="password" name="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-2xl" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-white/50">Master Key Management</p>
          </div>

          <Card className="bg-black/60 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 space-y-4">
              {/* Device Info */}
              <div className="flex items-center justify-center gap-2 text-white/40 text-xs mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span>Device: {deviceId || 'Generating...'}</span>
              </div>

              {isLocked && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <div className="text-red-400 font-semibold mb-1 flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Account Locked
                  </div>
                  <div className="text-white/60 text-sm">Try again in {formatTime(lockTimeLeft)}</div>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(lockTimeLeft / (5 * 60)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-white/60 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Admin Key
                </Label>
                <Input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLocked && handleAdminLogin()}
                  onFocus={(e) => {
                    e.target.setAttribute('readonly', 'readonly');
                    setTimeout(() => e.target.removeAttribute('readonly'), 50);
                  }}
                  disabled={isLocked || loading}
                  placeholder="Enter admin key..."
                  className="bg-white/5 border-white/10 text-white font-mono"
                  style={{ WebkitTextSecurity: 'disc' }}
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {!isLocked && attempts > 0 && attempts < 5 && (
                <div className="flex items-center gap-2 text-yellow-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{5 - attempts} attempts remaining before lock</span>
                </div>
              )}

              <Button
                onClick={handleAdminLogin}
                disabled={!adminKeyInput.trim() || loading || isLocked}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                Access Admin Panel
              </Button>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span>Secure POST request (key not in URL)</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span>Brute force protection (5 attempts)</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span>Memory-only key storage (no localStorage)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 blur-lg rounded-xl" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-white/40">Master Key Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="text-white/40 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                  <Key className="w-4 h-4" />
                  Total Keys
                </div>
                <div className="text-2xl font-bold text-white">{stats.total_keys}</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Active
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.active_keys}</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  Active Sessions
                </div>
                <div className="text-2xl font-bold text-white">{stats.active_sessions}</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Failed (24h)
                </div>
                <div className="text-2xl font-bold text-yellow-400">{stats.failed_attempts_24h}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/90 border-white/10 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-green-400" />
                    Create Master Key
                  </DialogTitle>
                </DialogHeader>
                
                {!generatedKey ? (
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-white/60">Key Name / User</Label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., John Doe - Premium"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white/60">Expires (days)</Label>
                        <Input
                          type="number"
                          value={newKeyExpiry}
                          onChange={(e) => setNewKeyExpiry(e.target.value)}
                          placeholder="30"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white/60">Max Devices</Label>
                        <Input
                          type="number"
                          value={newKeyMaxDevices}
                          onChange={(e) => setNewKeyMaxDevices(e.target.value)}
                          placeholder="1"
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={createKey}
                      disabled={!newKeyName.trim()}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600"
                    >
                      Generate Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Label className="text-green-400 text-sm mb-2 block">Generated Master Key</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/50 p-3 rounded font-mono text-white break-all">
                          {generatedKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(generatedKey)}
                          className="h-10"
                        >
                          {copiedKey ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-yellow-400/80 text-xs mt-2">
                        <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                        Copy this key now! It won&apos;t be shown again.
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setGeneratedKey('');
                        setNewKeyName('');
                        setShowCreateDialog(false);
                      }}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search keys..."
                className="pl-10 bg-white/5 border-white/10 text-white w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="all">All Keys</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Keys List */}
        <Card className="bg-black/40 border-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-400" />
              Master Keys ({filteredKeys.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredKeys.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No keys found</p>
                </div>
              ) : (
                filteredKeys.map((key) => (
                  <div
                    key={key.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      key.is_active && !isExpired(key.expires_at)
                        ? 'bg-white/5 border-white/10'
                        : 'bg-red-500/5 border-red-500/20'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          key.is_active && !isExpired(key.expires_at)
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        )}>
                          {key.is_active && !isExpired(key.expires_at) ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{key.name}</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs',
                                key.is_active && !isExpired(key.expires_at)
                                  ? 'border-green-500/30 text-green-400'
                                  : 'border-red-500/30 text-red-400'
                              )}
                            >
                              {key.is_active && !isExpired(key.expires_at) ? 'Active' : isExpired(key.expires_at) ? 'Expired' : 'Revoked'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-white/40 text-xs mt-1">
                            <span>Created: {formatDate(key.created_at)}</span>
                            <span>Devices: {key.current_devices}/{key.max_devices}</span>
                            <span>Uses: {key.usage_count}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                        >
                          {expandedKey === key.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        {key.is_active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeKey(key.id)}
                            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reactivateKey(key.id)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <Unlock className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKey(key.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedKey === key.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-white/40">Key ID:</span>
                            <code className="ml-2 text-white/60">{key.id}</code>
                          </div>
                          <div>
                            <span className="text-white/40">Created By:</span>
                            <span className="ml-2 text-white/60">{key.created_by}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Expires:</span>
                            <span className="ml-2 text-white/60">{formatDate(key.expires_at)}</span>
                          </div>
                          <div>
                            <span className="text-white/40">Last Used:</span>
                            <span className="ml-2 text-white/60">{formatDate(key.last_used)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
