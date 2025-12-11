'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundary3DProps {
  children: ReactNode;
  fallbackMessage?: string;
  retryText?: string;
}

interface ErrorBoundary3DState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary3D extends Component<ErrorBoundary3DProps, ErrorBoundary3DState> {
  constructor(props: ErrorBoundary3DProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundary3DState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Environment Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallbackMessage = 'Failed to load 3D environment', retryText = 'Retry' } = this.props;

      return (
        <div className="w-full h-[70vh] bg-black rounded-lg flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-400 text-sm text-center max-w-md">
            {fallbackMessage}
          </p>
          {this.state.error && (
            <p className="text-gray-600 text-xs font-mono">
              {this.state.error.message}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="mt-2 border-secondary/50 text-secondary hover:bg-secondary/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryText}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
