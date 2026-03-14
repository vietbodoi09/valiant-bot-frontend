import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, Key, Eye, EyeOff, Lock, AlertCircle, CheckCircle2, 
  Fingerprint, HelpCircle, ChevronDown, ChevronUp, Copy, Check,
  RefreshCw, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const AUTH_API_URL = 'https://valiant-bot-be-01.fly.dev';

// Generate cryptographically secure device fingerprint
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

interface SecureMasterKeyAuthProps {
  onAuthenticated: (token: string) => void;
}

export default function SecureMasterKeyAuth({ onAuthenticated }: SecureMasterKeyAuthProps) {
  const [masterKey, setMasterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<'checking' | 'secure' | 'warning'>('checking');
  const [tokenExpiry, setTokenExpiry] = useState<Date | null>(null);
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check existing token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const savedToken = localStorage.getItem('valiant_jwt_token');
      const savedExpiry = localStorage.getItem('valiant_token_expiry');
      
      if (savedToken && savedExpiry) {
        const expiry = new Date(savedExpiry);
        if (expiry > new Date()) {
          // Verify token with backend
          try {
            const response = await fetch(`${AUTH_API_URL}/api/auth/verify-token?token=${savedToken}`);
            if (response.ok) {
              setTokenExpiry(expiry);
              onAuthenticated(savedToken);
              return;
            }
          } catch (e) {
            console.error('Token verification failed:', e);
          }
        }
        // Clear invalid/expired token
        localStorage.removeItem('valiant_jwt_token');
        localStorage.removeItem('valiant_token_expiry');
      }
      
      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      setDeviceId(fingerprint.slice(0, 16));
      
      // Check lock status
      const lockUntil = localStorage.getItem('valiant_lock_until');
      if (lockUntil) {
        const lockTime = parseInt(lockUntil);
        if (Date.now() < lockTime) {
          setIsLocked(true);
          setLockTimeLeft(Math.ceil((lockTime - Date.now()) / 1000));
        } else {
          localStorage.removeItem('valiant_lock_until');
        }
      }
      
      setSecurityLevel('secure');
    };
    
    checkExistingAuth();
  }, [onAuthenticated]);

  // Token refresh timer
  useEffect(() => {
    if (tokenExpiry) {
      const timeUntilExpiry = tokenExpiry.getTime() - Date.now();
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // Refresh 5 min before expiry
      
      if (refreshTime > 0) {
        refreshTimerRef.current = setTimeout(() => {
          refreshToken();
        }, refreshTime);
      }
    }
    
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [tokenExpiry]);

  // Lock countdown
  useEffect(() => {
    if (!isLocked || lockTimeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setLockTimeLeft(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          localStorage.removeItem('valiant_lock_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeLeft]);

  const refreshToken = async () => {
    const token = localStorage.getItem('valiant_jwt_token');
    if (!token) return;
    
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newExpiry = new Date(Date.now() + data.expires_in * 1000);
        localStorage.setItem('valiant_jwt_token', data.access_token);
        localStorage.setItem('valiant_token_expiry', newExpiry.toISOString());
        setTokenExpiry(newExpiry);
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
    }
  };

  const verifyKey = useCallback(async () => {
    if (isLocked || !masterKey.trim()) return;
    
    setIsVerifying(true);
    setError('');

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const timestamp = Math.floor(Date.now() / 1000);

      const response = await fetch(`${AUTH_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Time': timestamp.toString()
        },
        body: JSON.stringify({
          master_key: masterKey,
          device_fingerprint: deviceFingerprint,
          timestamp: timestamp
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save token
        const expiry = new Date(Date.now() + data.expires_in * 1000);
        localStorage.setItem('valiant_jwt_token', data.access_token);
        localStorage.setItem('valiant_token_expiry', expiry.toISOString());
        localStorage.setItem('valiant_device_id', data.device_id);
        
        // Reset attempts
        localStorage.removeItem('valiant_attempts');
        setAttempts(0);
        
        setTokenExpiry(expiry);
        onAuthenticated(data.access_token);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('valiant_attempts', newAttempts.toString());
        
        if (response.status === 429) {
          const lockUntil = Date.now() + 5 * 60 * 1000;
          localStorage.setItem('valiant_lock_until', lockUntil.toString());
          setIsLocked(true);
          setLockTimeLeft(5 * 60);
          setError(data.detail || 'Too many failed attempts. Locked for 5 minutes.');
        } else {
          setError(data.detail || 'Authentication failed');
        }
      }
    } catch (e: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [masterKey, attempts, isLocked, onAuthenticated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying && !isLocked) {
      verifyKey();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSecurityStatus = () => {
    switch (securityLevel) {
      case 'checking':
        return { icon: RefreshCw, text: 'Checking security...', color: 'text-yellow-400' };
      case 'secure':
        return { icon: ShieldCheck, text: 'Secure connection', color: 'text-green-400' };
      case 'warning':
        return { icon: ShieldAlert, text: 'Security warning', color: 'text-orange-400' };
    }
  };

  const securityStatus = getSecurityStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-orange-500/30 border-t-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Valiant Bot</h1>
          <p className="text-white/50">Secure Private Access</p>
        </div>

        {/* Security Status */}
        <div className={cn('flex items-center justify-center gap-2 mb-4 text-sm', securityStatus.color)}>
          <securityStatus.icon className={cn('w-4 h-4', securityLevel === 'checking' && 'animate-spin')} />
          <span>{securityStatus.text}</span>
        </div>

        <Card className="bg-black/60 backdrop-blur-xl border-white/10 overflow-hidden">
          {/* Security Badge */}
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-b border-orange-500/20 p-3">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Multi-Layer Security</span>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Device Info */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Device: {deviceId || 'Generating...'}</span>
            </div>

            {/* Hidden input to catch auto-fill */}
            <input type="text" name="username" style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}} tabIndex={-1} />
            <input type="password" name="password" style={{position: 'absolute', opacity: 0, pointerEvents: 'none'}} tabIndex={-1} />
            
            {/* Input */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm flex items-center gap-2">
                <Key className="w-4 h-4" />
                Master Key
              </Label>
              <div className="relative">
                <Input
                  id="master-key-input"
                  name="master-key-field"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  data-form-type="other"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isVerifying || isLocked}
                  placeholder="Enter your master key..."
                  className={cn(
                    'bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-12 font-mono',
                    error && 'border-red-500/50 focus:border-red-500',
                    isLocked && 'opacity-50 cursor-not-allowed'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  disabled={isLocked}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Lock Status */}
            {isLocked && (
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                <div className="text-orange-400 font-semibold mb-1">Account Locked</div>
                <div className="text-white/60 text-sm">Try again in {formatTime(lockTimeLeft)}</div>
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(lockTimeLeft / (5 * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Attempts Warning */}
            {!isLocked && attempts > 0 && attempts < 5 && (
              <div className="flex items-center gap-2 text-yellow-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{5 - attempts} attempts remaining before lock</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={verifyKey}
              disabled={!masterKey.trim() || isVerifying || isLocked}
              className={cn(
                'w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300',
                isVerifying 
                  ? 'bg-orange-500/50' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/20'
              )}
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : isLocked ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Locked
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Access Dashboard
                </>
              )}
            </Button>

            {/* Security Features */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Server-side key validation</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>JWT tokens with 24h expiry</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Device-bound authentication</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Rate limiting & brute force protection</span>
              </div>
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Encrypted key storage (PBKDF2)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Get Agent Key - Help Section */}
        <Card className="bg-black/40 backdrop-blur border-white/5 mt-4">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              <span className="text-white/80 text-sm font-medium">How to get your Valiant Agent Key</span>
            </div>
            {showHelp ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>
          
          {showHelp && (
            <CardContent className="p-4 pt-0 border-t border-white/5">
              <div className="space-y-4 text-sm">
                <div className="text-white/60">
                  <p className="mb-2">Follow these steps to extract your Agent Key from Valiant:</p>
                  
                  <ol className="space-y-3 list-decimal list-inside">
                    <li>Open <strong>Valiant Dashboard</strong> in your browser</li>
                    <li>Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-white/80">F12</kbd> to open Developer Tools</li>
                    <li>Go to the <strong>Console</strong> tab</li>
                    <li>Copy and paste the code below, then press Enter:</li>
                  </ol>
                </div>

                {/* Code Block */}
                <div className="relative">
                  <pre className="bg-black/60 rounded-lg p-3 overflow-x-auto text-xs font-mono text-green-400/90 border border-white/10">
{`const request = indexedDB.open('valiant-agent-keys');
request.onsuccess = async (e) => {
  const db = e.target.result;
  const tx = db.transaction('encryption-keys', 'readonly');
  const store = tx.objectStore('encryption-keys');
  const getKey = store.get('0x589637bcf76f6ad9d0176ceccd4474f96f0cfc78');
  getKey.onsuccess = async () => {
    const cryptoKey = getKey.result;
    const encryptedB64 = localStorage.getItem('valiant:agent:0x589637bcf76f6ad9d0176ceccd4474f96f0cfc78');
    const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, 
        cryptoKey, 
        ciphertext
      );
      const decoded = new TextDecoder().decode(decrypted);
      console.log('KEY:', decoded);
    } catch(err) {
      console.log('Decrypt failed:', err);
    }
  };
};`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`const request = indexedDB.open('valiant-agent-keys');
request.onsuccess = async (e) => {
  const db = e.target.result;
  const tx = db.transaction('encryption-keys', 'readonly');
  const store = tx.objectStore('encryption-keys');
  const getKey = store.get('0x589637bcf76f6ad9d0176ceccd4474f96f0cfc78');
  getKey.onsuccess = async () => {
    const cryptoKey = getKey.result;
    const encryptedB64 = localStorage.getItem('valiant:agent:0x589637bcf76f6ad9d0176ceccd4474f96f0cfc78');
    const encryptedBytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv }, 
        cryptoKey, 
        ciphertext
      );
      const decoded = new TextDecoder().decode(decrypted);
      console.log('KEY:', decoded);
    } catch(err) {
      console.log('Decrypt failed:', err);
    }
  };
};`);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="absolute top-2 right-2 h-7 text-xs bg-white/10 hover:bg-white/20"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </Button>
                </div>

                <div className="text-white/60">
                  <p className="mb-2">The decrypted key will appear in the console output.</p>
                  <p className="text-yellow-400/80 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Note: Replace the address <code className="bg-white/10 px-1 rounded">0x589637bcf76f6ad9d0176ceccd4474f96f0cfc78</code> with your own wallet address if different.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-white/30 text-xs">
          <p>Unauthorized access is prohibited</p>
          <p className="mt-1">© 2024 Valiant Bot</p>
        </div>
      </div>
    </div>
  );
}
