import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../api/axios";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing Stripe session id");
        return;
      }

      try {
        const res = await API.post("/payment/verify-payment", { sessionId });
        setStatus("success");
        setMessage(res.data?.message || "Payment verified successfully");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Payment verification failed");
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="page-center">
      <div className="card auth-card">
        {status === "verifying" && <h2>Verifying payment...</h2>}
        {status === "success" && <h2 className="success">{message}</h2>}
        {status === "error" && <h2 className="error">{message}</h2>}
        <Link to="/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
