import { Component } from "react";
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error);
    console.error("Component stack:", info?.componentStack);
    this.setState({ errorInfo: info });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    try {
      // Clear all sb-* keys from localStorage and sessionStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("sb-")) localStorage.removeItem(key);
      }
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith("sb-")) sessionStorage.removeItem(key);
      }
    } catch {}
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg, #f6f4ef 0%, #ecf3ef 100%)" }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-5 text-white"
            style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Hitilafu Imejitokeza</h2>
                <p className="text-xs text-white/80">Something went wrong</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-stone-700">
              Mfumo umekutana na tatizo. Hili linaweza kutokea kwa sababu ya session ya zamani au tatizo la muunganiko.
            </p>

            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-stone-500">Error Details</p>
              <p className="text-[11px] font-mono text-red-700 break-words">
                {(this.state.error?.name || "Error") + ": " + String(this.state.error?.message || this.state.error || "Unknown error").slice(0, 300)}
              </p>
              {this.state.error?.stack && (
                <details className="text-[10px] text-stone-500 mt-2">
                  <summary className="cursor-pointer font-medium">Stack trace</summary>
                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-48">
                    {String(this.state.error.stack).slice(0, 1500)}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={this.handleClearAndReload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg, #047857, #064e3b)" }}
              >
                <Trash2 className="w-4 h-4" />
                Futa Session & Ingia Tena
              </button>
              <button
                onClick={this.handleRefresh}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Jaribu Tena (Refresh)
              </button>
            </div>

            <p className="text-[11px] text-stone-500 text-center pt-2">
              Kama tatizo linaendelea, wasiliana na msimamizi wa mfumo
            </p>
          </div>
        </div>
      </div>
    );
  }
}
