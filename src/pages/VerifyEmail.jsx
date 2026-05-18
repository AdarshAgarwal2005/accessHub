import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";

const VerifyEmail = () => {
  const { token } = useParams();
  const hasVerified = useRef(false);
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await API.get(`/auth/verify/${token}`);
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully");
      } catch (error) {
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed");
      }
    };

    if (token && !hasVerified.current) {
      hasVerified.current = true;
      verify();
    }
  }, [token]);

  return (
    <div className="page-center">
      <div className="card auth-card">
        {status === "verifying" && <h2>Verifying email...</h2>}
        {status === "success" && <h2 className="success">{message}</h2>}
        {status === "error" && <h2 className="error">{message}</h2>}
        <Link to="/login">Go to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
