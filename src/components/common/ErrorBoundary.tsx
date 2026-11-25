import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, Home, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  /** "page" renders a full-viewport fallback; "panel" renders an inline workspace fallback. */
  variant?: 'page' | 'panel';
  /** Optional custom heading override. */
  title?: string;
  /** Optional custom subtitle override. */
  description?: string;
  /** Optional callback invoked when the user clicks Reset / Try Again. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes('loading chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed')
  );
}

/**
 * Shared React Error Boundary for route-level and portal-panel fault isolation.
 * Reports uncaught render errors to Sentry and offers safe recovery actions.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
    try {
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    } catch {
      // Ignore Sentry reporting errors if uninitialized
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.assign('/');
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { variant = 'panel', title, description } = this.props;
    const chunkError = isChunkLoadError(this.state.error);
    const resolvedTitle =
      title ||
      (chunkError
        ? 'Application Update Available'
        : variant === 'page'
          ? 'Something Went Wrong'
          : 'Section Execution Faulted');

    const resolvedDescription =
      description ||
      (chunkError
        ? 'A newer version of Kashmir Curators was deployed or a network module failed to load. Reload to fetch the latest workspace.'
        : variant === 'page'
          ? 'An unexpected error interrupted this page. You can retry rendering or return to the home screen.'
          : 'An unexpected runtime exception interrupted this panel. The rest of the dashboard remains active.');

    return (
      <div
        role="alert"
        className={
          variant === 'page'
            ? 'min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8 bg-background text-foreground'
            : 'w-full min-h-[340px] sm:min-h-[400px] flex items-center justify-center p-4 sm:p-8 text-center animate-in fade-in duration-300'
        }
      >
        <div className="bg-card/90 border border-destructive/25 max-w-lg w-full p-6 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden text-center">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-destructive/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-destructive" />
          </div>

          <h3 className="text-lg sm:text-xl font-display font-black text-foreground uppercase tracking-tight mb-2">
            {resolvedTitle}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm mx-auto font-medium">
            {resolvedDescription}
          </p>

          {this.state.error && (
            <div className="bg-muted/40 border border-border/70 p-3.5 rounded-xl mb-6 text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                System Exception
              </span>
              <p className="text-xs font-mono text-destructive font-bold truncate max-w-full">
                {this.state.error.name}: {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
            {chunkError ? (
              <Button
                type="button"
                onClick={this.handleReload}
                className="font-bold h-11 px-6 rounded-xl gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reload Application
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={this.handleReset}
                className="font-bold h-11 px-5 rounded-xl gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
            )}

            {variant === 'page' && (
              <Button
                type="button"
                variant={chunkError ? 'outline' : 'default'}
                onClick={this.handleGoHome}
                className="font-bold h-11 px-5 rounded-xl gap-2"
              >
                <Home className="w-4 h-4" /> Return Home
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
