/** Shared responsive navigation + footer. Sticky positioning keeps content in flow. */
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon, Loading } from "./UI";
export function Protected({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (admin && user.role !== "admin")
    return (
      <div className="container section">
        <h1>Administrator access required</h1>
        <Link to="/">Go home</Link>
      </div>
    );
  return children;
}
export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="container nav-shell">
          <Link className="brand" to="/" aria-label="ChefKart home">
            <span className="brand-mark">
              <Icon name="chef" size={25} />
            </span>
            Chef<span>Kart</span>
            <span className="brand-dot">.</span>
          </Link>
          <button
            className="menu-button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
          <nav
            id="main-navigation"
            className={open ? "navigation open" : "navigation"}
            aria-label="Main navigation"
          >
            <NavLink to="/chef-search">Find a cook</NavLink>
            <NavLink to="/services">Our services</NavLink>
            <NavLink to="/join-chefkart">Cook with us</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            {user ? (
              <>
                <NavLink to="/bookings">My bookings</NavLink>
                {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
                <button className="btn small secondary" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link className="btn small dark" to="/login">
                Sign in <Icon name="arrow" size={16} />
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link className="brand" to="/">
              ChefKart<span className="brand-dot">.</span>
            </Link>
            <p>
              Good food. Familiar flavours.
              <br />A little more time for you.
            </p>
            <small>A learning project for home-cooking services.</small>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/chef-search">Find a cook</Link>
            <Link to="/services">Our services</Link>
            <Link to="/blog">Kitchen journal</Link>
            <Link to="/testimonial">Stories</Link>
            <Link to="/explore/gallery">Kitchen inspiration</Link>
          </div>
          <div>
            <h4>ChefKart</h4>
            <Link to="/about">About the project</Link>
            <Link to="/join-chefkart">Cook with us</Link>
            <Link to="/career">Careers</Link>
            <Link to="/investor-relation">Investor enquiries</Link>
          </div>
          <div>
            <h4>Your kitchen, your way</h4>
            <p>Start with a cook who understands what you love.</p>
            <Link className="text-link" to="/register">
              Create a cook profile <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} ChefKart project</span>
          <Link to="/contact">Have a question? Let’s talk.</Link>
        </div>
      </footer>
    </>
  );
}
