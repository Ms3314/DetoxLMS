import { NavLink } from "react-router-dom";
import { useAuth } from "./context";

/** Nav tab that is "Profile" when signed in and "Log in" otherwise. */
export default function AccountNav() {
  const { user } = useAuth();
  return (
    <NavLink
      to={user ? "/profile" : "/login"}
      className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
    >
      {user ? "Profile" : "Log in"}
    </NavLink>
  );
}
