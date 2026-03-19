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

  // Check existing token on mount — only check lock status, skip token verify (App.tsx handles it)
  useEffect(() => {
    const initAuth = async () => {
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
      
      // Check saved attempts
      const savedAttempts = localStorage.getItem('valiant_attempts');
      if (savedAttempts) setAttempts(parseInt(savedAttempts));
      
      setSecurityLevel('secure');
    };
    
    initAuth();
  }, []);

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
    if (isLocked || !masterKey.trim() || isVerifying) return;
    
    setIsVerifying(true);
    setError('');

    try {
      const deviceFingerprint = await generateDeviceFingerprint();
      const timestamp = Math.floor(Date.now() / 1000);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${AUTH_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Client-Time': timestamp.toString()
        },
        body: JSON.stringify({
          master_key: masterKey.trim(),
          device_fingerprint: deviceFingerprint,
          timestamp: timestamp
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let data;
      try {
        data = await response.json();
      } catch {
        setError('Invalid response from server. Please try again.');
        return;
      }

      if (response.ok && data.access_token) {
        // Save token FIRST, then notify parent
        const expiry = new Date(Date.now() + (data.expires_in || 86400) * 1000);
        localStorage.setItem('valiant_jwt_token', data.access_token);
        localStorage.setItem('valiant_token_expiry', expiry.toISOString());
        if (data.device_id) localStorage.setItem('valiant_device_id', data.device_id);
        
        // Reset attempts
        localStorage.removeItem('valiant_attempts');
        setAttempts(0);
        
        setTokenExpiry(expiry);
        
        // Small delay to ensure localStorage is committed before parent re-renders
        await new Promise(r => setTimeout(r, 100));
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
            <img src="/valbot-logo.png" alt="ValBot" className="relative w-20 h-20 rounded-2xl shadow-2xl shadow-orange-500/30" />
            <div className="absolute -inset-2 rounded-3xl border-2 border-orange-500/30 border-t-orange-500 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ValBot</h1>
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

            {/* Input */}
            <div className="space-y-2">
              <Label className="text-white/60 text-sm flex items-center gap-2">
                <Key className="w-4 h-4" />
                Master Key
              </Label>
              <div className="relative">
                <Input
                  id="master-key-input"
                  name="master-key"
                  type="password"
                  autoComplete="current-password"
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

        {/* How to Get Master Key - Help Section */}
        <Card className="bg-black/40 backdrop-blur border-white/5 mt-4">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-400" />
              <span className="text-white/80 text-sm font-medium">How to get your Master Key</span>
            </div>
            {showHelp ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>
          
          {showHelp && (
            <CardContent className="p-4 pt-0 border-t border-white/5">
              <div className="space-y-4 text-sm">
                <div className="text-white/60">
                  <p className="mb-3">Master Key is required to access the ValBot dashboard. To get your key:</p>
                  
                  <ol className="space-y-3 list-decimal list-inside">
                    <li>Join our Discord server</li>
                    <li>Go to the <strong>#get-key</strong> channel</li>
                    <li>Follow the instructions to receive your Master Key</li>
                  </ol>
                </div>

                {/* Discord CTA */}
                <a href="https://discord.gg/xKhmZeTBAX" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all shadow-lg shadow-[#5865F2]/20 hover:shadow-[#5865F2]/30">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
                  </svg>
                  Join Discord — Get Master Key
                </a>

                <p className="text-white/30 text-[11px] text-center">
                  Need help? Ask in <strong>#support</strong> channel on Discord
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-white/30 text-xs">
          <p>Unauthorized access is prohibited</p>
          <p className="mt-1">© 2025 ValBot</p>
        </div>
      </div>
    </div>
  );
}
