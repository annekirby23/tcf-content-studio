"use client";

export default function Error({ error }) {
  return (
    <div style={{ padding: "40px", fontFamily: "monospace", background: "#FEF2F2", minHeight: "100vh" }}>
      <h2 style={{ color: "#991B1B", marginBottom: "16px" }}>⚠️ App crash — please share this with your developer</h2>
      <pre style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #FCA5A5", color: "#7F1D1D", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px" }}>
        {error?.message}
        {"\n\n"}
        {error?.stack}
      </pre>
    </div>
  );
}
