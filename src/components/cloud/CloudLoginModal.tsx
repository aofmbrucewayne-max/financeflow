'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useThemeStore } from '@/lib/stores/themeStore';

type Step = 'email' | 'otp';

interface CloudLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudLoginModal({ isOpen, onClose }: CloudLoginModalProps) {
  const c = useThemeStore((s) => s.colors);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resolveInteraction = useRef<((params: Record<string, string>) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for Dexie Cloud's userInteraction to handle login steps
  useEffect(() => {
    if (!isOpen) return;
    const sub = db.cloud.userInteraction.subscribe((ia) => {
      if (!ia) return;
      if (ia.type === 'otp') {
        setStep('otp');
        setLoading(false);
        setError('');
        resolveInteraction.current = ia.onSubmit as (params: Record<string, string>) => void;
      } else if (ia.type === 'email') {
        if (email) {
          (ia.onSubmit as (params: Record<string, string>) => void)({ email: email.trim() });
        } else {
          setLoading(false);
        }
      } else if (ia.type === 'message-alert') {
        const alerts = (ia as { alerts?: { message: string }[] }).alerts;
        if (alerts?.length) {
          setError(alerts.map((a: { message: string }) => a.message).join('. '));
          setLoading(false);
        }
      }
    });
    return () => sub.unsubscribe();
  }, [isOpen, email]);

  // Watch for login completion
  useEffect(() => {
    if (!isOpen) return;
    const sub = db.cloud.currentUser.subscribe((user) => {
      if (user?.isLoggedIn) {
        toast.success(`Syncing as ${user.email}`);
        resetAndClose();
      }
    });
    return () => sub.unsubscribe();
  }, [isOpen]);

  const resetAndClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
    setLoading(false);
    resolveInteraction.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onClose();
  };

  const handleSendEmail = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');

    // This triggers the Dexie Cloud login flow.
    // With customLoginGui:true, it emits on userInteraction for each step.
    // The promise resolves when login is complete.
    db.cloud.login({ email: email.trim(), grant_type: 'otp' })
      .then(() => {
        toast.success('Logged in successfully!');
        resetAndClose();
      })
      .catch((err: unknown) => {
        setError(String(err instanceof Error ? err.message : 'Login failed'));
        setLoading(false);
      });
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');

    const submitFn = resolveInteraction.current;
    if (submitFn) {
      submitFn({ otp: otp.trim() });
    } else {
      // Fallback: try direct login with OTP
      db.cloud.login({
        email: email.trim(),
        grant_type: 'otp',
        otp: otp.trim(),
      });
    }

    // Safety timeout — if nothing happens after 15s, stop loading
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setError('Verification timed out. Please try again.');
        }
        return false;
      });
    }, 15000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <div className="flex items-center gap-2">
            {step === 'email' && <Mail className="w-4 h-4" style={{ color: c.accent }} />}
            {step === 'otp' && <KeyRound className="w-4 h-4" style={{ color: c.accent }} />}
            <h2 className="text-base font-semibold" style={{ color: c.textPrimary }}>
              {step === 'email' ? 'Login to Sync' : 'Enter Verification Code'}
            </h2>
          </div>
          <button onClick={resetAndClose} className="p-1.5 rounded-lg" style={{ color: c.textSecondary }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ backgroundColor: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
            >
              {error}
            </div>
          )}

          {step === 'email' && (
            <>
              <p className="text-xs" style={{ color: c.textTertiary }}>
                Enter your email. We&apos;ll send you a one-time code to verify.
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendEmail(); }}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: c.bgTertiary,
                  border: `1px solid ${c.borderDefault}`,
                  color: c.textPrimary,
                }}
              />
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-xs" style={{ color: c.textTertiary }}>
                Check <strong style={{ color: c.textPrimary }}>{email}</strong> for the verification code.
              </p>
              <input
                type="text"
                placeholder="Enter code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
                autoFocus
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: c.bgTertiary,
                  border: `1px solid ${c.borderDefault}`,
                  color: c.textPrimary,
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '4px',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="text-xs underline"
                style={{ color: c.textSecondary }}
              >
                Use a different email
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${c.borderDefault}` }}>
          <button
            onClick={resetAndClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: c.bgTertiary, color: c.textSecondary, border: `1px solid ${c.borderDefault}` }}
          >
            Cancel
          </button>
          <button
            onClick={step === 'email' ? handleSendEmail : handleVerifyOtp}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: c.gradient, color: '#fff' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Please wait...' : step === 'email' ? 'Send Code' : 'Verify & Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
