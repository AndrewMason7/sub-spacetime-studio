import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Workstation Uncaught Exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#020408',
            color: '#e2e8f0',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: 'rgba(13, 19, 32, 0.95)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                color: '#f43f5e'
              }}
            >
              <AlertTriangle size={24} />
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  margin: 0
                }}
              >
                Quantum Simulator Anomaly Detected
              </h2>
            </div>

            <p
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: '1.6',
                marginBottom: '16px',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              The WebGL2 workstation encountered an unexpected graphics context or runtime state.
              Your simulation parameters can be reset to restore standard holographic manifold operation.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(5, 8, 16, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '11px',
                  color: '#fda4af',
                  overflowX: 'auto',
                  marginBottom: '20px',
                  maxHeight: '140px'
                }}
              >
                <code>{this.state.error.message || String(this.state.error)}</code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(180deg, rgba(125, 211, 252, 0.25) 0%, rgba(56, 189, 248, 0.1) 100%)',
                border: '1px solid rgba(125, 211, 252, 0.45)',
                color: '#7dd3fc',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              <RotateCcw size={14} />
              <span>Re-initialize Workstation</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
