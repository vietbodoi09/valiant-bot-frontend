import { useState, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const API_URL = 'https://valiant-bot-be-01.fly.app';

interface SecureMasterKeyAuthProps {
  onAuthenticated: () => void;
}

export default function SecureMasterKeyAuth({ onAuthenticated }: SecureMasterKeyAuthProps) {
  const [masterKey, setMasterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const savedToken = localStorage.getItem('valiant_jwt_token');
    if (savedToken) {
      onAuthenticated();
    }
    
    // Generate device fingerprint
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
    ];
    const hash = components.join('|').split('').reduce((a, b) => {
      const c = b.charCodeAt(0);
      return ((a << 5) - a) + c;
    }, 0);
    setDeviceId(Math.abs(hash).toString(16).substring(0, 12));
  }, [onAuthenticated]);

  const verifyKey = async () => {
    if (!masterKey.trim()) return;
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_key: masterKey,
          device_fingerprint: deviceId,
          timestamp: Math.floor(Date.now() / 1000)
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('valiant_jwt_token', data.access_token);
        localStorage.setItem('valiant_token_expiry', new Date(Date.now() + data.expires_in * 1000).toISOString());
        onAuthenticated();
      } else {
        setError(data.detail || 'Invalid master key');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Valiant Bot</h1>
          <p className="text-white/50">Enter Master Key to Access</p>
        </div>

        <Card className="bg-black/60 backdrop-blur-xl border-white/10">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-b border-orange-500/20 p-3">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Secure Access</span>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Device: {deviceId || '...'}</span>
            </div>

            <div className="space-y-2">
              <Label className="text-white/60 text-sm flex items-center gap-2">
                <Key className="w-4 h-4" />
                Master Key
              </Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyKey()}
                  placeholder="Enter your master key..."
                  className={cn('bg-white/5 border-white/10 text-white pr-12 font-mono', error && 'border-red-500')}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={verifyKey}
              disabled={!masterKey.trim() || isVerifying}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {isVerifying ? 'Verifying...' : <><Shield className="w-5 h-5 mr-2" /> Access Dashboard</>}
            </Button>

            <div className="pt-4 border-t border-white/5 space-y-2 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Device-bound authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Server-side key validation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
