/** All three service pages reuse this component and select the matching API content. */
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import {
  DataState,
  Empty,
  HowItWorks,
  Icon,
  PageHeading,
} from "../components/UI";
const routes = {
  monthly: "/cook-for-month",
  "one-time": "/one-time-cook",
  party: "/chef-for-party",
};
export default function Services({ type }) {
  const query = useApi("/content/services");
  const rows = query.data?.filter((row) => !type || row.category === type);
  return (
    <div className="container page">
      <PageHeading
        eyebrow="YOUR KITCHEN, YOUR WAY"
        title={
          type
            ? {
                monthly: "Everyday food. Everyday comfort.",
                "one-time": "A day off from the kitchen.",
                party: "Good company. Great food.",
              }[type]
            : "A little help for every occasion."
        }
      >
        Choose the kind of cooking help that fits your day.
      </PageHeading>
      <DataState query={query}>
        <div className={type ? "service-detail" : "service-grid"}>
          {rows?.map((row) => (
            <article key={row._id} className="form-card">
              <span className="service-icon">
                <Icon
                  name={
                    row.category === "monthly"
                      ? "calendar"
                      : row.category === "party"
                        ? "chef"
                        : "bowl"
                  }
                  size={32}
                />
              </span>
              <h2>{row.title}</h2>
              <p className="muted prose">{row.content}</p>
              <Link
                to={
                  type ? "/chef-search" : routes[row.category] || "/chef-search"
                }
                className="btn"
              >
                {type ? "Find a cook" : "Explore service"}
                <Icon name="arrow" size={18} />
              </Link>
            </article>
          ))}
          {!rows?.length && (
            <Empty title="Services are being updated">
              Please check the cook directory for available profiles.
            </Empty>
          )}
          {type && (
            <div className="service-illustration">
              <img
                src="/assets/kitchen.png"
                alt="Home cooking with a little help"
              />
              <p>Your home. Your flavours. Your time.</p>
            </div>
          )}
        </div>
      </DataState>
      <HowItWorks />
      <div className="faq-block">
        <h2>A few things to know</h2>
        <details>
          <summary>Are ingredients included?</summary>
          <p>
            Bring your own ingredients and make cooking utensils available.
            Share your menu and dietary preferences in the booking notes.
          </p>
        </details>
        <details>
          <summary>Can I change a booking?</summary>
          <p>
            Yes. Sign in and open My bookings to edit the date, address or
            notes, or cancel the booking.
          </p>
        </details>
        <details>
          <summary>How does pricing work?</summary>
          <p>
            The profile shows an estimate per visit. A monthly estimate is 26
            visits and a party estimate is three times the visit price. This
            project does not collect payments or dispatch a real cook.
          </p>
        </details>
      </div>
    </div>
  );
}
