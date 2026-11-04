/** Login and signup share a form; native validation is backed by server validation. */
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Field, Notice, Icon } from "../components/UI";
export default function Auth() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "signup" ? "signup" : "login";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { authenticate } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await authenticate(mode, values);
      const from = location.state?.from;
      navigate(
        typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//")
          ? from
          : "/bookings",
        { replace: true },
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-page">
      <div className="auth-story">
        <p className="eyebrow">WELCOME TO YOUR NEXT CHAPTER</p>
        <h1>
          Good food.
          <br />
          Less to do.
          <br />
          <span>More you.</span>
        </h1>
        <p>
          Save your bookings, meet your next cook,
          <br />
          and make a little more room for life.
        </p>
        <Icon name="bowl" size={90} />
      </div>
      <div className="form-card auth-card">
        <p className="eyebrow">MAKE YOURSELF AT HOME</p>
        <h2>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
        <p className="muted">
          {mode === "signup"
            ? "A few details and you’re ready to get started."
            : "Sign in to manage your kitchen plans."}
        </p>
        <Notice>{error}</Notice>
        <form onSubmit={submit} key={mode}>
          {mode === "signup" && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              maxLength={100}
              required
            />
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={mode === "signup" ? 8 : 1}
            maxLength={72}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            hint={mode === "signup" ? "At least 8 characters." : undefined}
          />
          <button className="btn full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="auth-switch">
          {mode === "signup" ? "Already have an account?" : "New to ChefKart?"}{" "}
          <button
            className="text-button"
            onClick={() => {
              setParams(
                { mode: mode === "signup" ? "login" : "signup" },
                { state: location.state },
              );
              setError("");
            }}
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
        <Link to="/" className="muted small">
          Back to home
        </Link>
      </div>
    </div>
  );
}
