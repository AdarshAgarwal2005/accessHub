const PlanCard = ({ plan, onSelect }) => {
  return (
    <div className={`plan-card ${plan.featured ? "featured" : ""}`}>
      {plan.featured && <span className="plan-badge">Popular</span>}
      <div>
        <h3>{plan.planName}</h3>
        <p>{plan.description}</p>
      </div>

      <div className="plan-meta">
        <span>{plan.duration === 0 ? "Lifetime free" : `${plan.duration} days`}</span>
        <strong>Rs {plan.price}</strong>
      </div>

      <div className="plan-track">
        <span style={{ width: `${plan.featured ? 100 : plan.price === 0 ? 35 : 68}%` }} />
      </div>

      <button className="btn btn-primary" onClick={() => onSelect(plan)} disabled={!plan.id}>
        {plan.id ? "Buy Now" : "Add Plan ID"}
      </button>
    </div>
  );
};

export default PlanCard;
