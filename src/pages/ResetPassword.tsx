"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/shadcn_ui/button";
import { Input } from "@/components/shadcn_ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn_ui/card";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      toast.error("Missing fields", {
        description: "Please fill out all fields",
        position: "top-center",
        richColors: true,
      });
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Try again",
        position: "top-center",
        richColors: true,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Error", {
          description: error.message,
          position: "top-center",
          richColors: true,
        });
      } else {
        toast.success("Password updated", {
          description: "Login with your new password",
          position: "top-center",
          richColors: true,
        });
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            Reset Your PasteBoard Password
          </CardTitle>
          <p className="text-center text-gray-500 text-sm mt-2">
            Keep your clipboard sync secure. Choose a strong password to protect
            your notes & copies.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full"
            />
            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Tip: Use at least 8 characters, with numbers & symbols for best
              security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
