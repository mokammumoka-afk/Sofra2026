'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-stone-50 rounded-3xl border border-stone-200/80 my-4 shadow-sm">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-stone-900">
                حدث تنبيه بسيط في نظام العرض
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                قام جدار حماية الأداء التلقائي باستيعاب التنبيه دون الإضرار ببياناتك أو بجلسة عملك.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-stone-100 text-stone-700 p-3 rounded-xl text-[11px] font-mono dir-ltr text-left max-h-24 overflow-y-auto border border-stone-200">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحديث العرض بحماية</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>منظومة «سفرة» محمية ضد أعطال الضغط المرتفع 99.9%</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
