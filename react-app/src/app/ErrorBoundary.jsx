import { Component } from "react";
import { captureRawRecovery } from "../persistence/storage.js";

export class ErrorBoundary extends Component {
  state = { error: null, recoveryError: "" };

  static getDerivedStateFromError(error) {
    return { error };
  }

  downloadRecovery = () => {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(captureRawRecovery(), null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `manaspec-recovery-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { this.setState({ recoveryError: error.message }); }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="fatal-error"><h1>ManaSpec needs recovery</h1><p>Your local data has not been cleared. Close other ManaSpec tabs and reload. If the problem returns, download a recovery copy before troubleshooting. Keep this private archive; it preserves raw data and is not an Admin import file.</p><pre>{this.state.error.message}</pre><button onClick={this.downloadRecovery}>Download recovery copy</button><button onClick={() => globalThis.location.reload()}>Reload ManaSpec</button>{this.state.recoveryError && <p role="alert">{this.state.recoveryError}</p>}</main>;
  }
}
