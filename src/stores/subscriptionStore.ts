import { create } from "zustand";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: "free" | "monthly" | "yearly";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionState {
  subscription: UserSubscription | null;
  loading: boolean;

  setSubscription: (subscription: UserSubscription | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()((set) => ({
  subscription: null,
  loading: false,

  setSubscription: (subscription) => set({ subscription }),
  setLoading: (loading) => set({ loading }),
}));
