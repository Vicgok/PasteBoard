/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";

export const useAuth = () => {
  const {
    user,
    session,
    profile,
    loading,
    initialized,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  } = useAuthStore();

  // Initialize auth service only once
  useEffect(() => {
    if (!initialized) {
      authService.initialize();
    }

    return () => {
      // Cleanup on unmount
      authService.cleanup();
    };
  }, [initialized]);

  // Memoized auth methods to prevent re-renders
  const optimizedSignInWithEmail = useCallback(signInWithEmail, []);
  const optimizedSignInWithGoogle = useCallback(signInWithGoogle, []);
  const optimizedSignUp = useCallback(signUp, []);
  const optimizedSignOut = useCallback(signOut, []);
  const optimizedResetPassword = useCallback(resetPassword, []);
  const optimizedUpdateProfile = useCallback(updateProfile, []);

  return {
    user,
    session,
    profile,
    loading,
    initialized,
    signInWithEmail: optimizedSignInWithEmail,
    signInWithGoogle: optimizedSignInWithGoogle,
    signUp: optimizedSignUp,
    signOut: optimizedSignOut,
    resetPassword: optimizedResetPassword,
    updateProfile: optimizedUpdateProfile,
  };
};
// import { useContext } from "react";
// import { createContext } from "react";
// import type { AuthContextType } from "@/contexts/auth-types";

// // Create the context (you'll need to import this in AuthContext.tsx)
// export const AuthContext = createContext<AuthContextType>({
//   user: null,
//   session: null,
//   profile: null,
//   loading: true,
//   signInWithEmail: async () => ({ error: null }),
//   signInWithGoogle: async () => ({ error: null }),
//   signUp: async () => ({ error: null }),
//   signOut: async () => ({ error: null }),
//   resetPassword: async () => ({ error: null }),
//   updateProfile: async () => ({ error: null }),
//   refreshProfile: async () => {},
// });

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// };

// // Hook for getting user data in a format compatible with your components
// export const useUser = () => {
//   const { user, profile, loading } = useAuth();

//   return {
//     user:
//       user && profile
//         ? {
//             id: user.id,
//             email: user.email || "",
//             name: profile.name,
//             avatar_url: profile.avatar_url,
//           }
//         : null,
//     loading,
//   };
// };
