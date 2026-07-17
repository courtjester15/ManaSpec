import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-error"><h1>ManaSpec hit an unexpected error</h1><p>Your local data has not been cleared. Reload the app; if the problem returns, export or preserve browser storage before troubleshooting.</p><pre>{this.state.error.message}</pre><button onClick={() => globalThis.location.reload()}>Reload ManaSpec</button></main>;
  }
}
