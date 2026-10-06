import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  /** Short name shown in the fallback, e.g. "canvas". */
  area: string;
  children: React.ReactNode;
  /** Compact fallback for side panels. */
  compact?: boolean;
};

type State = { error: Error | null };

/**
 * Keeps one broken panel from blanking the whole app. Your plans are saved
 * automatically, so "Try again" or a reload is always safe.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.area}]`, error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        className={`flex flex-col items-center justify-center text-center gap-3 ${
          this.props.compact ? "p-4" : "w-full h-full p-8"
        } text-slate-700 dark:text-slate-200`}
      >
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <div>
          <p className="font-semibold">Something went wrong in the {this.props.area}.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Your work is saved. Try again, or reload the app if it keeps happening.
          </p>
          <p className="text-[11px] font-mono text-rose-500 mt-2 max-w-md break-words">{error.message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => this.setState({ error: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
