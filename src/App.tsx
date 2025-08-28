import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary, withLazyLoading } from "@/utils/index";
import { useAuth } from "@/hooks/useAuth";

// Lazy load components for better performance
const Login = withLazyLoading(() => import("@/pages/Login"));
const SignUp = withLazyLoading(() => import("@/pages/SignUp"));
const Dashboard = withLazyLoading(() => import("@/pages/Dashboard"));
const Account = withLazyLoading(() => import("@/pages/Account"));
const Subscription = withLazyLoading(() => import("@/pages/Subscription"));
const ResetPassword = withLazyLoading(() => import("@/pages/ResetPassword"));
// Loading fallback component
const AppLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 text-lg">Loading PasteBoard...</p>
    </div>
  </div>
);

// Error fallback component
const AppErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
      <p className="text-gray-600 mb-4">
        PasteBoard encountered an unexpected error. Please try refreshing the
        page.
      </p>
      {error && process.env.NODE_ENV === "development" && (
        <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <summary className="cursor-pointer font-medium">
            Error Details
          </summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
        </details>
      )}
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Refresh Application
      </button>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <AppLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <AppLoadingFallback />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<AppLoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                }
              />

              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e5e7eb",
              color: "#374151",
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
// // import { AuthProvider } from "@/contexts/AuthContext";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import {
//   Login,
//   SignUp,
//   Dashboard,
//   Subscription,
//   ResetPassword,
//   Account,
// } from "./pages";
// import { Toaster } from "@/components/shadcn_ui/sonner";
// import AppLayoutWrapper from "./components/layout/AppLayoutWrapper";
// import ProtectedRoute from "./ProtectedRoute";

// const App = () => {
//   return (
//     // <AuthProvider>
//     <BrowserRouter>
//       <AppLayoutWrapper>
//         <Routes>
//           <Route path="/" element={<Login />} />
//           <Route path="/signup" element={<SignUp />} />
//           <Route path="/reset-password" element={<ResetPassword />} />
//           <Route element={<ProtectedRoute />}>
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/account" element={<Account />} />
//             <Route path="/subscription" element={<Subscription />} />
//           </Route>
//         </Routes>
//         <Toaster />
//       </AppLayoutWrapper>
//     </BrowserRouter>
//     // </AuthProvider>
//   );
// };

// export default App;
