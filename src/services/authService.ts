import { supabase } from "@/lib/supabaseClient";
import { useAuthStore, type Profile } from "@/stores/index";
import type { User } from "@supabase/supabase-js";

class AuthService {
  private initialized = false;
  private authStateChangeSubscription: {
    data: { subscription: { unsubscribe: () => void } };
  } | null = null;
  private pendingProfileLoad: Map<string, Promise<Profile | null>> = new Map();

  async initialize() {
    if (this.initialized) return;

    const {
      setUser,
      setSession,
      setProfile,
      setLoading,
      setInitialized,
      loadUserProfile,
      upsertUserProfile,
      initialized: storeInitialized,
    } = useAuthStore.getState();

    // If store thinks it's initialized but we're not, reset the store state
    if (storeInitialized && !this.initialized) {
      console.log(
        "AuthService: Store initialized but service not - checking session validity"
      );
    }

    // Always check session validity regardless of store state
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        setInitialized(true);
        return;
      }

      if (session?.user) {
        console.log("AuthService: Valid session found, setting up auth state");
        setUser(session.user);
        setSession(session);

        // Load profile with deduplication
        const profile = await this.loadUserProfileCached(
          session.user.id,
          loadUserProfile,
          upsertUserProfile,
          session.user
        );
        if (profile) {
          setProfile(profile);
        }
      } else {
        console.log("AuthService: No valid session found, clearing auth state");
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }

    // Set up auth state listener (only once)
    if (!this.authStateChangeSubscription) {
      this.authStateChangeSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state change event:", event, "Session:", !!session);

          const {
            setUser,
            setSession,
            setProfile,
            setLoading,
            loadUserProfile,
            upsertUserProfile,
          } = useAuthStore.getState();

          // Handle all events that involve a valid session
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "INITIAL_SESSION"
          ) {
            console.log("Setting user and session from auth state change");
            setUser(session?.user ?? null);
            setSession(session);

            if (session?.user) {
              const profile = await this.loadUserProfileCached(
                session.user.id,
                loadUserProfile,
                upsertUserProfile,
                session.user
              );
              if (profile) {
                setProfile(profile);
              }
            }
            setLoading(false);
          }

          if (event === "SIGNED_OUT") {
            console.log("Clearing user and session from auth state change");
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
            // Clear any pending profile loads
            this.pendingProfileLoad.clear();
          }
        }
      );
    }

    this.initialized = true;
  }

  // Add a method to manually update auth state after login
  async updateAuthState() {
    const {
      setUser,
      setSession,
      setProfile,
      loadUserProfile,
      upsertUserProfile,
    } = useAuthStore.getState();

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        return;
      }

      console.log("Manually updating auth state with session:", !!session);

      if (session?.user) {
        setUser(session.user);
        setSession(session);

        const profile = await this.loadUserProfileCached(
          session.user.id,
          loadUserProfile,
          upsertUserProfile,
          session.user
        );
        if (profile) {
          setProfile(profile);
        }
      }
    } catch (error) {
      console.error("Error updating auth state:", error);
    }
  }

  // Cached profile loading to prevent duplicate requests
  private async loadUserProfileCached(
    userId: string,
    loadUserProfile: (userId: string) => Promise<Profile | null>,
    upsertUserProfile: (user: User) => Promise<Profile | null>,
    user: User
  ) {
    // Check if we already have a pending request for this user
    if (this.pendingProfileLoad.has(userId)) {
      return this.pendingProfileLoad.get(userId);
    }

    // Create new promise and cache it
    const profilePromise = (async () => {
      try {
        let profile = await loadUserProfile(userId);
        if (!profile) {
          profile = await upsertUserProfile(user);
        }
        return profile;
      } catch (error) {
        console.error("Error loading profile:", error);
        return null;
      } finally {
        // Remove from cache when done
        this.pendingProfileLoad.delete(userId);
      }
    })();

    this.pendingProfileLoad.set(userId, profilePromise);
    return profilePromise;
  }

  cleanup() {
    if (this.authStateChangeSubscription) {
      this.authStateChangeSubscription.data.subscription.unsubscribe();
      this.authStateChangeSubscription = null;
    }
    this.initialized = false;
    this.pendingProfileLoad.clear();
  }
}

export const authService = new AuthService();
