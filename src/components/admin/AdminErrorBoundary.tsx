import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AdminErrorBoundary] Uncaught operational crash:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="bg-[#0f1216]/80 border border-red-500/20 max-w-lg w-full p-10 rounded-[2.5rem] shadow-2xl shadow-red-950/10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-red-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-2">Section Execution Faulted</h3>
            
            <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-sm mx-auto font-medium">
              An unexpected runtime exception interrupted this panel. The rest of the dashboard remains active.
            </p>

            {this.state.error && (
              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-8 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-1">System Exception</span>
                <p className="text-xs font-mono text-red-300 font-bold truncate max-w-full">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <Button 
              onClick={this.handleReset}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-12 px-6 rounded-xl gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset Panel state
            </Button>
          </div>
        </div>
      );
    }

    return this.children;
  }
}
export default AdminErrorBoundary;
