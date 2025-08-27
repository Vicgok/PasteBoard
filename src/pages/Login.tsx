import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import GoogleLogo from "@/components/custom_ui/GoogleLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn_ui/dialog";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { useAuth } from "@/hooks/useAuth";
import { getDeviceInfo } from "@/lib/getDeviceInfo";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const {
    signInWithEmail,
    signInWithGoogle,
    loading: authLoading,
    user,
    session,
  } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    const uaData = getDeviceInfo();
    console.log(uaData);
    if (!authLoading && user && session) {
      navigate("/dashboard");
    }
  }, [authLoading, user, session, navigate]);

  const handleInputChange = (
    field: keyof LoginFormData,
    value: string
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    // Prevent login if auth is still loading
    if (authLoading) {
      toast.error("Please wait, checking existing session...");
      return;
    }

    setLoginLoading(true);
    try {
      const { email, password } = formData;
      const { error } = await signInWithEmail(email, password);
      if (!error) {
        navigate("/dashboard");
      } else {
        toast.error(`${error.message}`, {
          description: `Incorrect email or password`,
          position: "top-center",
          richColors: true,
        });
      }
      // Reset form
      setFormData({
        email: "",
        password: "",
      });
    } catch (error) {
      console.log("Error in handleEmailLogin=>", error);
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    // Prevent login if auth is still loading
    if (authLoading) {
      toast.error("Please wait, checking existing session...");
      return;
    }

    setLoginLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (!error) {
        navigate("/dashboard");
      } else {
        toast.error(`${error.message}`, {
          description: `Google SignIn failed`,
          position: "top-center",
          richColors: true,
        });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading screen while checking existing session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Checking existing session...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        showForgot || showReset ? "backdrop-blur-sm" : ""
      }`}
    >
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl lg:grid-cols-2">
        {/* Left Side - Company Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 text-white bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/2 right-32 w-16 h-16 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-5xl font-bold mb-6">PasteBoard</h1>
            <p className="text-xl opacity-90 leading-relaxed mb-8">
              Welcome back! Access your clipboard management solution and
              continue organizing your code snippets across all devices.
            </p>

            <div className=" pt-8 border-t border-white border-opacity-20">
              <p className="opacity-70">
                "Seamless experience every time I log in"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header */}
            <div className="text-center lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">PasteBoard</h1>
              <p className="text-gray-600">Welcome back to your workspace</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome Back 👋
              </h1>
              <p className="text-gray-600">
                Sign in to access your PasteBoard account
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Email */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("email", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="text-sm text-blue-600 hover:underline font-medium"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                onClick={handleEmailLogin}
                disabled={loginLoading || authLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Continue with Email"
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-4 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loginLoading || authLoading}
                className="w-full border border-gray-200 py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GoogleLogo />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Forgot Password Modal */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle>Forgot Password?</DialogTitle>
          </DialogHeader>
          <ForgotPassword
            onEmailSent={() => {
              setShowForgot(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="sm:max-w-md rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <ResetPassword />
        </DialogContent>
      </Dialog>
      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        © 2025 PasteBoard. All rights reserved.
      </p>
    </div>
  );
};

export default Login;
