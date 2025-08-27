import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Login,
  SignUp,
  Dashboard,
  Subscription,
  ResetPassword,
  Account,
} from "./pages";
import { Toaster } from "@/components/shadcn_ui/sonner";
import AppLayoutWrapper from "./components/layout/AppLayoutWrapper";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayoutWrapper>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account" element={<Account />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Routes>
          <Toaster />
        </AppLayoutWrapper>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
