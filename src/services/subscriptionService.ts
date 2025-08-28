import { supabase } from "@/lib/supabaseClient";
import { useSubscriptionStore, type UserSubscription } from "@/stores/index";

class SubscriptionService {
  private cache: Map<
    string,
    { data: UserSubscription | null; timestamp: number }
  > = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache for subscription data

  async fetchUserSubscription(userId: string, forceRefresh = false) {
    const { subscription, setSubscription, setLoading } =
      useSubscriptionStore.getState();

    // Check cache first
    const cached = this.cache.get(userId);
    if (
      !forceRefresh &&
      cached &&
      Date.now() - cached.timestamp < this.CACHE_DURATION
    ) {
      if (!subscription) {
        setSubscription(cached.data);
      }
      return cached.data;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      const subscriptionData = data || null;

      // Cache the result
      this.cache.set(userId, {
        data: subscriptionData,
        timestamp: Date.now(),
      });

      setSubscription(subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}

export const subscriptionService = new SubscriptionService();
