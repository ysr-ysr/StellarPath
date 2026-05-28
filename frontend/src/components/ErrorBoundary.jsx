import React from 'react';
import { ErrorState } from './ErrorState';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState message="This page could not be rendered." />;
    }

    return this.props.children;
  }
}
