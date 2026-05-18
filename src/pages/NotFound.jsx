import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="page-center">
      <div className="card auth-card">
        <h2>404</h2>
        <p>Page not found</p>
        <Link to="/">Go Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
