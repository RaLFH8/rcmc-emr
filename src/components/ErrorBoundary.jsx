import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Something Went Wrong
              </h1>
              <p className="text-gray-600">
                The application encountered an error. This might be due to cached files.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-red-800 mb-2">Error Details:</h2>
              <p className="text-sm text-red-700 font-mono break-all">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-blue-800 mb-3">Quick Fixes:</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
                <li>
                  <strong>Clear Browser Cache:</strong> Press <kbd className="px-2 py-1 bg-white border rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Delete</kbd>
                </li>
                <li>
                  <strong>Hard Refresh:</strong> Press <kbd className="px-2 py-1 bg-white border rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-white border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-white border rounded">R</kbd>
                </li>
                <li>
                  <strong>Try Incognito Mode:</strong> Open a new private/incognito window
                </li>
                <li>
                  <strong>Close All Tabs:</strong> Close all tabs with this site and reopen
                </li>
              </ol>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  // Clear local storage and reload
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Clear Cache & Reload
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Show Stack Trace (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
