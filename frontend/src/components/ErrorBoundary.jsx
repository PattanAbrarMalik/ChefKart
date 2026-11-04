/** A rendering error should show a recovery screen instead of a blank browser. */
import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error("Interface error:", error);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="container page">
          <h1>Something interrupted this page.</h1>
          <p>Reload to try again.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    return this.props.children;
  }
}
