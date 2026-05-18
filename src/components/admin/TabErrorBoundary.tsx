"use client";

import { Component, ReactNode } from "react";

interface Props {
  tabName: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: string;
}

/**
 * Per-tab error boundary for the admin shell. Without this, any throw inside
 * one tab (e.g. malformed Supabase response, missing field, JSON.parse on
 * legacy localStorage) crashes the whole /admin route — user sees only the
 * global error.tsx fallback with no diagnostic info.
 *
 * With this, only the broken tab shows the error + retry button. Other tabs
 * keep working. Error message is displayed inline so we can actually debug.
 */
export default class TabErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: "" };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error(`[admin/${this.props.tabName}] crashed:`, error, info);
    this.setState({ errorInfo: info.componentStack?.slice(0, 600) ?? "" });
    // Best-effort admin notification
    try {
      fetch("/api/admin/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: this.props.tabName,
          message: error.message,
          stack: error.stack?.slice(0, 1000),
          componentStack: info.componentStack?.slice(0, 1000),
        }),
      }).catch(() => {});
    } catch {}
  }

  reset = () => this.setState({ error: null, errorInfo: "" });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid #ef444433" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Раздел «{this.props.tabName}» упал
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Это локальная ошибка — остальная админка работает. Покажи это разработчику:
        </p>
        <pre style={{
          fontSize: 11, padding: 12, borderRadius: 8,
          background: "rgba(239,68,68,0.06)", color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.2)",
          overflow: "auto", maxHeight: 240, lineHeight: 1.5,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          <strong>{this.state.error.name}: {this.state.error.message}</strong>
          {this.state.error.stack && `\n\n${this.state.error.stack.slice(0, 800)}`}
          {this.state.errorInfo && `\n\nКомпонент:\n${this.state.errorInfo}`}
        </pre>
        <button onClick={this.reset}
          style={{
            marginTop: 12, padding: "8px 16px", borderRadius: 8,
            background: "#4561E8", color: "white", fontSize: 13, fontWeight: 600,
            border: "none", cursor: "pointer",
          }}>
          Попробовать снова
        </button>
      </div>
    );
  }
}
