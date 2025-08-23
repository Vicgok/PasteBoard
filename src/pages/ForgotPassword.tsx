import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type Props = { onEmailSent: () => void };

export default function ForgotPassword({ onEmailSent }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email", {
        position: "top-center",
        richColors: true,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, // page where ResetPassword.tsx lives
      });

      if (error) {
        toast.error("Error sending reset link", {
          description: "Invalid email address",
          position: "top-center",
          richColors: true,
        });
      } else {
        toast.success("Reset link sent!", {
          description: "Check your email for password reset instructions.",
          position: "top-center",
          richColors: true,
        });
        onEmailSent();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600 text-sm">
        Enter your email and we'll send a reset link.
      </p>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
      <button
        className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
        onClick={handleForgotPassword}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </div>
  );
}
