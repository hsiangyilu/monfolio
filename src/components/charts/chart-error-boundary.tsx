"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Component } from "react";

interface ChartErrorBoundaryProps {
  title: string;
  description: string;
  children: ReactNode;
  compact?: boolean;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  state: ChartErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`ChartErrorBoundary(${this.props.title})`, error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className={`flex h-full flex-col items-center justify-center border border-dashed border-gray-200 bg-gray-50 text-center ${
          this.props.compact
            ? "min-h-full rounded-full px-3 py-3"
            : "min-h-[240px] rounded-xl px-6 py-8"
        }`}
      >
        <div
          className={`flex items-center justify-center bg-white text-[#cd7b65] shadow-sm ${
            this.props.compact
              ? "mb-2 h-8 w-8 rounded-full"
              : "mb-4 h-12 w-12 rounded-2xl"
          }`}
        >
          <AlertTriangle className={this.props.compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>
        <p className={`font-semibold text-gray-900 ${this.props.compact ? "text-[11px]" : "text-sm"}`}>
          {this.props.title}
        </p>
        <p
          className={`mt-1 text-gray-500 ${
            this.props.compact
              ? "max-w-[9rem] text-[10px] leading-4"
              : "max-w-sm text-xs leading-5"
          }`}
        >
          {this.props.description}
        </p>
        <button
          type="button"
          onClick={this.handleRetry}
          className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white font-medium text-gray-700 transition-colors hover:bg-gray-100 ${
            this.props.compact
              ? "mt-2 px-2 py-1 text-[10px]"
              : "mt-4 px-3 py-2 text-xs"
          }`}
        >
          <RefreshCw className={this.props.compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {this.props.compact ? "重試" : "重新載入圖表"}
        </button>
      </div>
    );
  }
}
