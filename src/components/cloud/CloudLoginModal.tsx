'use client';

import { useState } from 'react';
import { X, Mail, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { useThemeStore } from '@/lib/stores/themeStore';

type Step = 'email' | 'otp' | null;

interface CloudLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudLoginModal({ isOpen, onClose }: CloudLoginModalProps) {
  const c = useThemeStore((s) => s.colors);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetAndClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setOtpId('');
    setError('');
    setLoading(false);
    onClose();
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Request OTP from Dexie Cloud
      const res = await fetch('https://zpqvn0kac.dexie.cloud/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'otp',
          email: email.trim(),
          scopes: ['ACCESS_DB'],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP');
      }
      setOtpId(data.otp_id || '');
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (err) {
      console.error('OTP request failed:', err);
      setError(String(err instanceof Error ? err.message : 'Failed to send code. Check your connection.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await db.cloud.login({
        grant_type: 'otp',
        email: email.trim(),
        otp: otp.trim(),
        otpId: otpId,
      });
      toast.success('Logged in! Your data will sync across devices.');
      resetAndClose();
    } catch (err) {
      console.error('OTP verify failed:', err);
      setError(String(err instanceof Error ? err.message : 'Invalid code. Please try again.'));
      setLoading(false);
    }
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }}
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
            onClick={step === 'email' ? handleSendOtp : handleVerifyOtp}
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
