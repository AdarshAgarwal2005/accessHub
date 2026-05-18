import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        AccessHub
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/profile" className="profile-thumb" title="Profile">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name || "Profile"} />
              ) : (
                <span>{initial}</span>
              )}
            </Link>
            <button className="btn btn-outline" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
