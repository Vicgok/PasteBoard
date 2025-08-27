import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn_ui/card";
import { Button } from "@/components/shadcn_ui/button";
import { Badge } from "@/components/shadcn_ui/badge";
import {
  Check,
  Crown,
  Zap,
  Shield,
  Users,
  Star,
  ArrowRight,
  CreditCard,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface UserSubscription {
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

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  yearlyPrice?: string;
  description: string;
  features: PlanFeature[];
  recommended?: boolean;
  stripePriceId: string;
  stripeYearlyPriceId?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  savings?: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    description: "Perfect for getting started",
    stripePriceId: "",
    icon: Users,
    color: "bg-gray-50 border-gray-200",
    features: [
      { text: "Sync across 2 devices", included: true },
      { text: "Basic history (7 days)", included: true },
      { text: "Standard support", included: true },
      { text: "5 projects limit", included: true },
      { text: "Advanced analytics", included: false },
      { text: "Priority sync", included: false },
      { text: "Unlimited devices", included: false },
      { text: "Extended history", included: false },
    ],
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "₹199",
    description: "Full access with monthly flexibility",
    stripePriceId: "price_monthly_pro_199", // Replace with actual Stripe price ID
    recommended: true,
    icon: Zap,
    color: "bg-blue-50 border-blue-200 ring-2 ring-blue-500",
    features: [
      { text: "Unlimited devices", included: true },
      { text: "Extended history (1 year)", included: true },
      { text: "Priority sync", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
      { text: "Custom integrations", included: true },
      { text: "Team collaboration", included: false },
    ],
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "₹1,999",
    yearlyPrice: "₹166/mo",
    description: "Best value with 2 months free",
    stripePriceId: "price_yearly_pro_1999", // Replace with actual Stripe price ID
    icon: Crown,
    color: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
    savings: "Save ₹389",
    features: [
      { text: "Everything in Pro Monthly", included: true },
      { text: "2 months free", included: true },
      { text: "Team collaboration", included: true },
      { text: "Advanced reporting", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
      { text: "Dedicated support", included: true },
      { text: "Early feature access", included: true },
    ],
  },
];

const Subscription = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userSubscription, setUserSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndSubscription();
  }, []);

  const fetchUserAndSubscription = async () => {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      setUser(user);

      if (user) {
        // Fetch user subscription
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (subError && subError.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error fetching subscription:", subError);
        } else if (subscription) {
          setUserSubscription(subscription);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, stripePriceId: string) => {
    if (!user) {
      alert("Please sign in to subscribe");
      return;
    }

    setProcessingPlan(planId);

    try {
      // Call your edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            priceId: stripePriceId,
            userId: user.id,
            planType: planId,
            successUrl: `${window.location.origin}/dashboard?subscription=success`,
            cancelUrl: `${window.location.origin}/subscription?canceled=true`,
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start subscription process. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!userSubscription?.stripe_customer_id) return;

    setLoading(true);

    try {
      // Call your edge function to create customer portal session
      const { data, error } = await supabase.functions.invoke(
        "create-portal-session",
        {
          body: {
            customerId: userSubscription.stripe_customer_id,
            returnUrl: `${window.location.origin}/subscription`,
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Failed to open subscription management. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!userSubscription) return planId === "free";
    return (
      userSubscription.plan_type === planId &&
      userSubscription.status === "active"
    );
  };

  const getButtonText = (plan: Plan) => {
    if (isCurrentPlan(plan.id)) return "Current Plan";
    if (plan.id === "free") return "Downgrade to Free";
    return `Choose ${plan.name}`;
  };

  const getButtonVariant = (plan: Plan) => {
    if (isCurrentPlan(plan.id)) return "secondary" as const;
    if (plan.recommended) return "default" as const;
    return "outline" as const;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading subscription information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Unlock the full potential of your productivity
          </p>

          {userSubscription && (
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="font-medium">
                Current Plan:{" "}
                {userSubscription.plan_type.charAt(0).toUpperCase() +
                  userSubscription.plan_type.slice(1)}
              </span>
              <Badge
                variant={
                  userSubscription.status === "active" ? "default" : "secondary"
                }
              >
                {userSubscription.status}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const IconComponent = plan.icon;

            return (
              <Card
                key={plan.id}
                className={`relative ${plan.color} ${
                  plan.recommended ? "scale-105 shadow-xl" : "shadow-lg"
                } transition-all duration-300 hover:shadow-xl`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      {plan.savings}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-white rounded-full shadow-md">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">{plan.description}</p>

                  <div className="mt-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {plan.price}
                      {plan.id !== "free" && (
                        <span className="text-lg text-gray-500">/mo</span>
                      )}
                    </div>
                    {plan.yearlyPrice && (
                      <div className="text-sm text-gray-600 mt-1">
                        Billed annually ({plan.yearlyPrice})
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    onClick={() =>
                      plan.stripePriceId
                        ? handleSubscribe(plan.id, plan.stripePriceId)
                        : null
                    }
                    disabled={
                      isCurrentPlan(plan.id) || processingPlan === plan.id
                    }
                    variant={getButtonVariant(plan)}
                    className="w-full mb-6 h-12 text-base font-semibold"
                  >
                    {processingPlan === plan.id ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getButtonText(plan)}
                        {!isCurrentPlan(plan.id) && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 ${
                            feature.included
                              ? "text-green-500"
                              : "text-gray-300"
                          }`}
                        >
                          <Check className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-sm ${
                            feature.included ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Subscription Management */}
        {userSubscription && userSubscription.plan_type !== "free" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Plan:</span>
                    <div className="font-semibold capitalize">
                      {userSubscription.plan_type}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="font-semibold capitalize">
                      {userSubscription.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Period:</span>
                    <div className="font-semibold">
                      {new Date(
                        userSubscription.current_period_start
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        userSubscription.current_period_end
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Billing:</span>
                    <div className="font-semibold">
                      {new Date(
                        userSubscription.current_period_end
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="w-full"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription & Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect immediately with prorated billing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 text-sm">
                All new users start with our free plan. You can upgrade anytime
                to unlock premium features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, debit cards, and digital
                wallets through Stripe's secure payment processing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll
                continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
