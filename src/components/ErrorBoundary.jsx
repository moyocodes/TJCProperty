import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-background">
          <div className="text-center">
            <h1 className="text-4xl font-heading mb-4 text-secondary">
              Something went wrong
            </h1>

            <p className="mb-6 text-neutral-muted">
              An unexpected error occurred.
            </p>

            <Link
              to="/"
              className="bg-primary text-white px-6 py-3 rounded-xl"
            >
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;