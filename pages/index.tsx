import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) router.replace("/dashboard"); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.replace("/dashboard");
    } else {
      setError(data.error || "Login failed");
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <>
      <Head>
        <title>EmbedLink — Login</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08080a; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .bg-grid {
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(88,101,242,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(88,101,242,0.05) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .bg-glow {
          position: fixed;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(88,101,242,0.1) 0%, transparent 70%);
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          margin: 1rem;
          padding: 2.75rem 2.5rem;
          background: rgba(14,14,18,0.97);
          border: 1px solid rgba(88,101,242,0.18);
          border-radius: 22px;
          backdrop-filter: blur(24px);
          box-shadow: 0 0 80px rgba(88,101,242,0.07), 0 24px 64px rgba(0,0,0,0.6);
          animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .card.shake { animation: shake 0.5s ease; }

        .logo-wrap {
          display: flex; justify-content: center;
          margin-bottom: 2rem;
          position: relative;
        }
        .ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 64px; height: 64px; border-radius: 50%;
          border: 1.5px solid rgba(88,101,242,0.45);
          animation: pulse-ring 2.2s ease-out infinite;
        }
        .ring2 {
          position: absolute;
          top: 50%; left: 50%;
          width: 64px; height: 64px; border-radius: 50%;
          border: 1.5px solid rgba(88,101,242,0.25);
          animation: pulse-ring 2.2s ease-out 0.7s infinite;
        }
        .logo-icon {
          position: relative; z-index: 1;
          width: 64px; height: 64px; border-radius: 18px;
          background: linear-gradient(135deg, #4752c4 0%, #7983f5 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
          box-shadow: 0 0 32px rgba(88,101,242,0.45), 0 8px 24px rgba(0,0,0,0.4);
          animation: float 4.5s ease-in-out infinite;
        }

        h1 {
          font-family: 'Space Mono', monospace;
          font-size: 1.3rem; font-weight: 700;
          color: #e8e8f2; text-align: center;
          margin-bottom: 0.3rem; letter-spacing: -0.3px;
        }
        .subtitle {
          color: #3f3f4e; font-size: 0.75rem;
          text-align: center; margin-bottom: 2.25rem;
          letter-spacing: 2px; text-transform: uppercase;
          font-family: 'Space Mono', monospace;
        }

        .form { display: flex; flex-direction: column; gap: 0.9rem; }

        .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .field-label {
          font-size: 0.7rem; font-weight: 500;
          color: #52525b; letter-spacing: 1.5px;
          text-transform: uppercase; font-family: 'Space Mono', monospace;
          padding-left: 2px;
        }
        .input-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 1rem; top: 50%;
          transform: translateY(-50%);
          font-size: 0.95rem; pointer-events: none;
        }
        .field-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.8rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 11px;
          color: #e8e8f2;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .field-input:focus {
          border-color: rgba(88,101,242,0.55);
          box-shadow: 0 0 0 3px rgba(88,101,242,0.1);
          background: rgba(88,101,242,0.03);
        }
        .field-input::placeholder { color: #2e2e38; }

        .pass-toggle {
          position: absolute; right: 0.85rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #3f3f4e; cursor: pointer;
          font-size: 1rem; padding: 0.2rem;
          transition: color 0.2s;
        }
        .pass-toggle:hover { color: #7983f5; }

        .error-box {
          padding: 0.65rem 1rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 9px;
          color: #fca5a5;
          font-size: 0.78rem;
          font-family: 'Space Mono', monospace;
          text-align: center;
          line-height: 1.4;
        }

        .submit-btn {
          width: 100%; margin-top: 0.4rem;
          padding: 0.9rem;
          background: linear-gradient(135deg, #4752c4, #7983f5);
          border: none; border-radius: 11px;
          color: #fff;
          font-family: 'Space Mono', monospace;
          font-size: 0.82rem; font-weight: 700;
          letter-spacing: 1.5px; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(88,101,242,0.3);
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.92; transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(88,101,242,0.4);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .spinner {
          display: inline-block; width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite;
          vertical-align: middle; margin-right: 0.5rem;
        }

        .footer-note {
          margin-top: 1.5rem; text-align: center;
          font-size: 0.7rem; color: #2a2a32;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="page">
        <div className="bg-grid" />
        <div className="bg-glow" />

        <div className={`card${shake ? " shake" : ""}`}>
          <div className="logo-wrap">
            <div className="ring" />
            <div className="ring2" />
            <div className="logo-icon">🔗</div>
          </div>

          <h1>EmbedLink</h1>
          <p className="subtitle">Discord File Embedder</p>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="field-label">Username</label>
              <div className="input-wrap">
                <span className="field-icon">👤</span>
                <input
                  ref={usernameRef}
                  type="text"
                  className="field-input"
                  placeholder="your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  placeholder="your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner" />VERIFYING...</>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>

          <p className="footer-note">accounts managed via neon db</p>
        </div>
      </div>
    </>
  );
}
