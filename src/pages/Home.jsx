import { useNavigate } from "react-router-dom";
import PlanCard from "../components/PlanCard";
import { PLANS } from "../config/plans";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate(`/dashboard?plan=${plan.id}`);
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-kicker">AccessHub Memberships</div>
        <h1>Secure Membership & Payment Flow</h1>
        <p>
          Login, verify email, choose a membership, and pay through Razorpay.
        </p>
        <div className="hero-stats">
          <span>Email verified access</span>
          <span>Razorpay test checkout</span>
          <span>Profile PDF export</span>
        </div>
      </section>

      <section className="section">
        <h2>Membership Plans</h2>
        <div className="grid">
          {PLANS.map((plan) => (
            <PlanCard key={plan.planName} plan={plan} onSelect={handleSelectPlan} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
