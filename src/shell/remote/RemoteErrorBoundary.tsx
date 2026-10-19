import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface RemoteErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  fallback: (error: Error, retry: () => void) => ReactNode;
  resetKey?: string;
}

interface RemoteErrorBoundaryState {
  error: Error | null;
  resetKey: string | undefined;
}

/**
 * E3: captura el fallo de carga de un remote para que no se propague al shell.
 * React no tiene un ErrorBoundary de serie, asi que este es un class component.
 */
export class RemoteErrorBoundary extends Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  constructor(props: RemoteErrorBoundaryProps) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { error, resetKey: undefined };
  }

  static getDerivedStateFromProps(
    props: RemoteErrorBoundaryProps,
    state: RemoteErrorBoundaryState,
  ): Partial<RemoteErrorBoundaryState> | null {
    if (props.resetKey !== undefined && props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private readonly retry = (): void => {
    this.setState({ error: null, resetKey: this.props.resetKey });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error !== null) return this.props.fallback(error, this.retry);
    return this.props.children;
  }
}