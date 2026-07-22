import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Accept Invitation — ZONIX Session OS" },
      { name: "description", content: "Complete your ZONIX dispatcher account onboarding." }
    ],
  }),
  component: JoinPage,
});

const API_BASE = 'https://zonix-backend-ouhi.onrender.com/api';

function JoinPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'form' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);

    if (!t) {
      setErrorMessage("No invitation token provided. Please check your invitation email link.");
      setStatus('error');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/invites/verify/${t}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || "Failed to verify invitation link.");
          setStatus('error');
          return;
        }
        setOrgName(data.orgName);
        setEmail(data.email);
        setStatus('form');
      } catch (err) {
        setErrorMessage("Network error. Unable to connect to ZONIX server.");
        setStatus('error');
      }
    }

    verify();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/invites/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          username: username.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create account.");
        setSubmitting(false);
        return;
      }

      setStatus('success');
    } catch (err) {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0f19',
      color: '#f3f4f6',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <img src="/zonix-logo.png" alt="ZONIX" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '20px', lineHeight: 1 }}>ZONIX</div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#00F0FF', fontWeight: 700, marginTop: '2px' }}>Session OS</div>
          </div>
        </div>

        {/* CARD CONTAINER */}
        <div style={{
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {status === 'loading' && (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid rgba(0,240,255,0.2)', borderTopColor: '#00F0FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>Verifying invitation link...</p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f87171', fontSize: '24px' }}>⚠️</div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Invalid Invitation</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.5 }}>{errorMessage}</p>
              <a href="/" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '14px', padding: '10px 20px', borderRadius: '12px' }}>
                Go to Homepage
              </a>
            </div>
          )}

          {status === 'form' && (
            <div>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '9999px', fontSize: '12px', color: '#00F0FF', fontWeight: 600, marginBottom: '16px' }}>
                ✓ Invitation Verified
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: '#fff', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>Create Your Account</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 24px 0' }}>
                You've been invited to join <strong style={{ color: '#00F0FF' }}>{orgName}</strong>
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Email Address</label>
                  <input type="email" value={email} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '14px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Choose Username</label>
                  <input type="text" required placeholder="e.g. john_dispatcher" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Set Password</label>
                  <input type="password" required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {formError && (
                  <div style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                    {formError}
                  </div>
                )}

                <button type="submit" disabled={submitting} style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', border: 0, fontWeight: 700, fontSize: '14px', padding: '14px', borderRadius: '12px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 8px 24px -6px rgba(37,99,235,0.5)' }}>
                  {submitting ? 'Creating Account...' : 'Complete Setup & Create Account'}
                </button>
              </form>
            </div>
          )}

          {status === 'success' && (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#34d399', fontSize: '28px' }}>✓</div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Account Ready!</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.5 }}>Your account has been created successfully. You can now log into the ZONIX Desktop App using your new credentials.</p>

              <a href="zonix://login" style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '14px', padding: '14px', borderRadius: '12px', textAlign: 'center', boxSizing: 'border-box', marginBottom: '12px' }}>
                Open ZONIX App
              </a>
              <a href="/ZONIX-Dispatcher-Setup-1.6.8.exe" style={{ fontSize: '12px', color: '#00F0FF', textDecoration: 'underline' }}>
                Don't have the app yet? Download ZONIX App (v1.6.8)
              </a>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
