"use client"
import React from "react"
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return this.props.fallback ?? <div className="text-sm text-muted-foreground p-4">圖表載入失敗</div>
    return this.props.children
  }
}
