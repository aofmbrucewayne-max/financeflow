'use client';

import { useState, useEffect } from 'react';
import { X, Mail, KeyRound } from 'lucide-react';
import { db } from '@/lib/db';
import { useThemeStore } from '@/lib/stores/themeStore';

type InteractionType = 'email' | 'otp' | 'message-alert' | 'logout-confirmation' | null;

interface CloudInteraction {
  type: string;
  title: string;
  alerts?: { type: string; message: string }[];
  fields: Record<string, { type: string; placeholder?: string; label?: string }>;
  submitLabel: string;
  cancelLabel?: string | null;
  onSubmit: (params: Record<string, string>) => void;
  onCancel: () => void;
}

export function CloudLoginModal() {
  const c = useThemeStore((s) => s.colors);
  const [interaction, setInteraction] = useState<CloudInteraction | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const sub = db.cloud.userInteraction.subscribe((ia) => {
      if (ia) {
        setInteraction(ia as CloudInteraction);
        // Initialize field values
        const values: Record<string, string> = {};
        if (ia.fields) {
          for (const key of Object.keys(ia.fields)) {
            values[key] = '';
          }
        }
        setFieldValues(values);
        setSubmitting(false);
      } else {
        setInteraction(null);
        setFieldValues({});
        setSubmitting(false);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  if (!interaction) return null;

  const handleSubmit = () => {
    setSubmitting(true);
    interaction.onSubmit(fieldValues);
  };

  const handleCancel = () => {
    interaction.onCancel();
    setInteraction(null);
  };

  const isEmail = interaction.type === 'email';
  const isOtp = interaction.type === 'otp';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <div className="flex items-center gap-2">
            {isEmail && <Mail className="w-4 h-4" style={{ color: c.accent }} />}
            {isOtp && <KeyRound className="w-4 h-4" style={{ color: c.accent }} />}
            <h2 className="text-base font-semibold" style={{ color: c.textPrimary }}>
              {interaction.title}
            </h2>
          </div>
          <button onClick={handleCancel} className="p-1.5 rounded-lg" style={{ color: c.textSecondary }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Alerts */}
          {interaction.alerts && interaction.alerts.length > 0 && (
            <div className="space-y-2">
              {interaction.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-sm"
                  style={{
                    backgroundColor: alert.type === 'error' ? '#ef444415' : c.accent + '15',
                    color: alert.type === 'error' ? '#ef4444' : c.accent,
                    border: `1px solid ${alert.type === 'error' ? '#ef444430' : c.accent + '30'}`,
                  }}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* Hint text */}
          {isEmail && (
            <p className="text-xs" style={{ color: c.textTertiary }}>
              Enter your email. We&apos;ll send you a one-time code to verify.
            </p>
          )}
          {isOtp && (
            <p className="text-xs" style={{ color: c.textTertiary }}>
              Check your email for the verification code.
            </p>
          )}

          {/* Fields */}
          {Object.entries(interaction.fields).map(([key, field]) => (
            <div key={key}>
              {field.label && (
                <label className="block text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>
                  {field.label}
                </label>
              )}
              <input
                type={key === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder || (key === 'email' ? 'your@email.com' : 'Enter code')}
                value={fieldValues[key] || ''}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: c.bgTertiary,
                  border: `1px solid ${c.borderDefault}`,
                  color: c.textPrimary,
                  fontSize: isOtp ? '20px' : '14px',
                  fontWeight: isOtp ? 600 : 400,
                  letterSpacing: isOtp ? '4px' : 'normal',
                  textAlign: isOtp ? 'center' : 'left',
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: `1px solid ${c.borderDefault}` }}>
          {interaction.cancelLabel !== null && (
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: c.bgTertiary, color: c.textSecondary, border: `1px solid ${c.borderDefault}` }}
            >
              {interaction.cancelLabel || 'Cancel'}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: c.gradient, color: '#fff' }}
          >
            {submitting ? 'Please wait...' : interaction.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
