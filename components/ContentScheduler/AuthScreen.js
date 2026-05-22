"use client";

import { useState } from "react";
import { C } from "./constants";

export default function AuthScreen({ needsSetup, onAuth }) {
  const [mode, setMode] = useState(needsSetup ? "setup" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "setup" ? "/api/auth/setup" : "/api/auth/login";
      const body = mode === "setup"
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      onAuth(data.token, data.user);
    } catch {
      setError("Connection error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "12px 16px",
    color: C.text,
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img
            src="/tcf-logo.png"
            alt="TCF"
            style={{ width: "90px", height: "auto", margin: "0 auto 16px", display: "block" }}
          />
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: C.text, margin: "0 0 8px" }}>TCF Content Studio</h1>
          <p style={{ fontSize: "14px", color: C.muted, margin: 0, fontStyle: "italic" }}>
            {mode === "setup" ? "Create your admin account to get started" : "We love that you are here, have a great day!"}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "32px" }}>
          {mode === "setup" && (
            <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(99,102,241,0.1)", border: `1px solid ${C.accent}40`, borderRadius: "10px", fontSize: "13px", color: C.accentBright }}>
              Welcome! You're the first here — this account will be the admin.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "setup" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Your Name
                </label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Anne Kirby"
                  required
                  autoFocus
                />
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Email
              </label>
              <input
                type="email"
                style={inputStyle}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@tcf.com"
                required
                autoFocus={mode === "login"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Password
              </label>
              <input
                type="password"
                style={inputStyle}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={mode === "setup" ? "Min. 6 characters" : "••••••••"}
                required
                minLength={mode === "setup" ? 6 : undefined}
              />
            </div>

            {error && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#EF4444", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "none",
                background: loading ? C.muted : `linear-gradient(135deg, ${C.accent}, #8B5CF6)`,
                color: "#fff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: loading ? "default" : "pointer",
                boxShadow: loading ? "none" : `0 0 20px rgba(99,102,241,0.3)`,
                transition: "all 0.15s",
              }}
            >
              {loading ? "Please wait…" : mode === "setup" ? "Create Admin Account" : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: C.muted }}>
          {mode === "setup"
            ? "Already have an account?"
            : "Need access?"}{" "}
          <button
            onClick={() => { setMode(mode === "setup" ? "login" : "setup"); setError(""); }}
            style={{ background: "none", border: "none", color: C.accentBright, cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
          >
            {mode === "setup" ? "Sign in" : "Contact your admin"}
          </button>
        </p>
      </div>
    </div>
  );
}
