/** Small shared presentational components. They contain no network or storage logic. */
import { Link } from "react-router-dom";

export function Icon({ name, size = 20, ...props }) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    pin: (
      <>
        <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    chef: (
      <>
        <path d="M7 15v6h10v-6a5 5 0 0 0 2-9 4 4 0 0 0-7-3 4 4 0 0 0-7 3 5 5 0 0 0 2 9ZM7 17h10" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18" />
      </>
    ),
    bowl: (
      <>
        <path d="M3 11h18a9 9 0 0 1-18 0ZM8 22h8M8 7V3m8 4V3M12 7V1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.chef}
    </svg>
  );
}
export function PageHeading({ eyebrow, title, children }) {
  return (
    <div className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p className="muted lead">{children}</p>}
    </div>
  );
}
export function Notice({ children, type = "error" }) {
  return children ? (
    <div
      className={`notice ${type}`}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Loading…
    </div>
  );
}
export function DataState({ query, children }) {
  if (query.loading) return <Loading />;
  if (query.error)
    return (
      <div>
        <Notice>{query.error}</Notice>
        <button className="btn secondary" onClick={query.reload}>
          Try again
        </button>
      </div>
    );
  return children;
}
// Input IDs come from their names, creating explicit label associations for accessibility.
export function Field({ label, name, children, hint, ...props }) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {children || <input id={name} name={name} {...props} />}
      {hint && <small className="muted">{hint}</small>}
    </div>
  );
}
export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="empty">
      <Icon name="bowl" size={34} />
      <h3>{title}</h3>
      <p className="muted">{children}</p>
    </div>
  );
}
export function Avatar({ chef, large = false }) {
  // A missing or failed profile image becomes readable initials, not a broken image icon.
  return (
    <div className={`avatar ${large ? "large" : ""}`}>
      <span>
        {chef.name
          ?.split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("")}
      </span>
      {chef.profilepic && (
        <img
          src={chef.profilepic}
          alt={chef.name}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
export function ChefCard({ chef }) {
  return (
    <article className="chef-card">
      <div className="chef-card-top">
        <Avatar chef={chef} />
        <span className="pill">
          {chef.sample
            ? "Sample profile"
            : chef.verified
              ? "Verified"
              : "New cook"}
        </span>
      </div>
      <h3>{chef.name}</h3>
      <p className="location">
        <Icon name="pin" size={15} />
        {chef.area}, {chef.city}
      </p>
      <div className="tags">
        {chef.cuisines.map((cuisine) => (
          <span key={cuisine}>{cuisine}</span>
        ))}
      </div>
      <p className="muted small">
        {chef.experience} years of experience · {chef.diet}
      </p>
      <div className="card-bottom">
        <p>
          <strong>₹{chef.price}</strong>
          <small> / visit estimate</small>
        </p>
        <Link
          to={`/chef/${chef._id}`}
          className="icon-link"
          aria-label={`View ${chef.name}`}
        >
          <Icon name="arrow" />
        </Link>
      </div>
    </article>
  );
}
export function HowItWorks() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A LITTLE HELP, A LOT MORE TIME</p>
          <h2>Your kitchen. Made easier.</h2>
        </div>
        <p className="muted">
          From finding your cook to planning your first meal.
        </p>
      </div>
      <div className="steps">
        {[
          [
            "01",
            "Find your fit",
            "Browse cooks by city, cuisine and experience.",
          ],
          [
            "02",
            "Make it yours",
            "Choose a service, date and your food preferences.",
          ],
          [
            "03",
            "Book your visit",
            "Save your booking and manage it in your account.",
          ],
          [
            "04",
            "Enjoy home cooking",
            "Have your ingredients ready and agree on the menu.",
          ],
        ].map(([n, title, description]) => (
          <article key={n}>
            <span className="step-number">{n}</span>
            <h3>{title}</h3>
            <p className="muted">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
