"use client";

import { Component } from "react";
import ContentScheduler from "@/components/ContentScheduler/index";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "40px", fontFamily: "monospace", background: "#FEF2F2", minHeight: "100vh" }}>
          <h2 style={{ color: "#991B1B", marginBottom: "16px" }}>⚠️ App Error (debug mode)</h2>
          <pre style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #FCA5A5", color: "#7F1D1D", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  return (
    <ErrorBoundary>
      <ContentScheduler />
    </ErrorBoundary>
  );
}
