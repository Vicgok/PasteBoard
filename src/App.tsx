import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login, SignUp, Dashboard, Billing, ResetPassword } from "./pages";
import { Toaster } from "@/components/shadcn_ui/sonner";
import AppLayoutWrapper from "./components/layout/AppLayoutWrapper";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <AppLayoutWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
          </Route>
        </Routes>
        <Toaster />
      </AppLayoutWrapper>
    </BrowserRouter>
  );
};

export default App;
