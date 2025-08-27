// contexts/AuthContext.tsx
import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { AuthContextType, Profile } from "./auth-types";
import { AuthContext } from "@/hooks/useAuth";
// import { getDeviceId } from "@/lib/generateDeviceId";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from database
  const loadUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  };

  // Create or update user profile
  const upsertUserProfile = async (user: User): Promise<Profile | null> => {
    try {
      const profileData = {
        id: user.id,
        email: user.email || "",
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User",
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture,
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("Error upserting profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error upserting profile:", error);
      return null;
    }
  };

  const prevUserId = useRef<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id ?? null;

      // Only act if user actually changed
      if (event === "SIGNED_IN" && prevUserId.current === currentUserId) {
        // same user, ignore redundant trigger
        setLoading(false);
        return;
      }

      prevUserId.current = currentUserId;

      if (event === "SIGNED_IN") {
        console.log("User logged in:", session?.user?.email);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          let userProfile = await loadUserProfile(session.user.id);
          if (!userProfile) {
            userProfile = await upsertUserProfile(session.user);
          }
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }

      if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });
    setLoading(false);
    return () => subscription.unsubscribe();
  }, []);

  // Auth Methods
  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    return { error };
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    });
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      const err = error instanceof Error ? error : new Error(String(error));
      return { error: err };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    const userProfile = await loadUserProfile(user.id);
    setProfile(userProfile);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
