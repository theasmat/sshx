import { Component, ErrorInfo, ReactNode } from "react";
import { BsExclamationTriangleFill, BsArrowRepeat } from "react-icons/bs";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#070a10] text-gray-200 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-lg bg-[#0b0f19] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <BsExclamationTriangleFill className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">
                {this.props.fallbackTitle || "Something went wrong"}
              </h2>
              <p className="text-xs text-gray-400">
                An unexpected error occurred in this view.
              </p>
            </div>

            {this.state.error && (
              <pre className="p-3 bg-[#04060a] border border-[#1f2942] rounded-xl text-[11px] font-mono text-rose-300 text-left overflow-x-auto whitespace-pre-wrap max-h-40 select-all">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <BsArrowRepeat className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="px-4 py-2 bg-[#161d30] hover:bg-[#1f2942] text-gray-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Try Dismissing
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
