"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA] dark:bg-zinc-950">
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                出错了，请刷新页面重试
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="mt-4 text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                刷新
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
