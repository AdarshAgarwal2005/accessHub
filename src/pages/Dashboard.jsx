import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../api/axios";
import { PLANS } from "../config/plans";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, fetchMe } = useAuth();
  const [searchParams] = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");
  const [loadingPlanId, setLoadingPlanId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const selectedPlan = PLANS.find((p) => p.id === planIdFromUrl);

  useEffect(() => {
    const updateTimer = () => {
      if (user?.membershipStatus !== "active") {
        setTimeLeft("");
        return;
      }

      if (!user.membershipExpiry) {
        setTimeLeft("Lifetime access");
        return;
      }

      const diff = new Date(user.membershipExpiry).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timer);
  }, [user?.membershipExpiry, user?.membershipStatus]);

  const loadRazorpayScript = () => (
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Could not load Razorpay checkout"));
      document.body.appendChild(script);
    })
  );

  const handleBuy = async (plan) => {
    try {
      setError("");
      setMessage("");
      setLoadingPlanId(plan.id);

      const res = await API.post("/payment/razorpay/create-order", {
        membershipId: plan.id,
        planName: plan.planName,
        duration: plan.duration,
        price: plan.price,
      });

      if (res.data?.free) {
        await fetchMe();
        setMessage(res.data.message || "Free membership activated");
        return;
      }

      await loadRazorpayScript();

      const razorpay = new window.Razorpay({
        key: res.data.keyId,
        amount: res.data.amount,
        currency: res.data.currency,
        name: "AccessHub",
        description: `${res.data.planName} Membership`,
        order_id: res.data.orderId,
        prefill: {
          name: res.data.user?.name || user?.name || "",
          email: res.data.user?.email || user?.email || "",
        },
        handler: async (response) => {
          try {
            await API.post("/payment/razorpay/verify", response);
            await fetchMe();
            setMessage("Membership activated successfully");
          } catch (err) {
            setError(err.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setLoadingPlanId(""),
        },
        theme: {
          color: "#2563eb",
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not start payment");
    } finally {
      setLoadingPlanId("");
    }
  };

  return (
    <div className="page">
      <section className="section">
        <h1>Dashboard</h1>
        <p>Welcome {user?.name || "User"}.</p>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <div className="card membership-card">
          <p>Membership: {user?.membershipStatus || "none"}</p>
          <p>Ends in: {timeLeft || "No active membership"}</p>
        </div>
      </section>

      {selectedPlan ? (
        <section className="section">
          <h2>Selected Plan</h2>
          <div className="card">
            <h3>{selectedPlan.planName}</h3>
            <p>{selectedPlan.description}</p>
            <p>Price: Rs {selectedPlan.price}</p>
            <button
              className="btn btn-primary"
              onClick={() => handleBuy(selectedPlan)}
              disabled={loadingPlanId === selectedPlan.id}
            >
              {loadingPlanId === selectedPlan.id ? "Opening Razorpay..." : "Pay with Razorpay"}
            </button>
          </div>
        </section>
      ) : (
        <section className="section">
          <h2>Your Membership</h2>
          <div className="card">
            <p>Choose a plan from the home page.</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
