import { Link } from "react-router-dom";

const PaymentCancel = () => {
  return (
    <div className="page-center">
      <div className="card auth-card">
        <h2>Payment Cancelled</h2>
        <p>Your transaction was not completed.</p>
        <Link to="/dashboard">Return to Dashboard</Link>
      </div>
    </div>
  );
};

export default PaymentCancel;
