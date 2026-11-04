/** A real directory record and a booking form connected to POST /api/bookings. */
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { api, money } from "../services/api";
import { Avatar, DataState, Icon } from "../components/UI";
import BookingForm from "../components/BookingForm";
export default function ChefDetail() {
  const { id } = useParams();
  const query = useApi(`/chefs/${id}`);
  const { user } = useAuth();
  const navigate = useNavigate();
  const chef = query.data;
  return (
    <div className="container page">
      <Link to="/chef-search" className="back-link">
        ← Back to cooks
      </Link>
      <DataState query={query}>
        {chef && (
          <div className="detail-grid">
            <div>
              <div className="profile-heading">
                <Avatar chef={chef} large />
                <div>
                  <p className="eyebrow">
                    {chef.sample
                      ? "SAMPLE COOK PROFILE"
                      : chef.verified
                        ? "VERIFIED COOK"
                        : "COOK PROFILE"}
                  </p>
                  <h1>{chef.name}</h1>
                  <p className="location">
                    <Icon name="pin" size={17} />
                    {chef.area}, {chef.city}
                  </p>
                </div>
              </div>
              <div className="profile-facts">
                <div>
                  <strong>{chef.experience} years</strong>
                  <span>Cooking experience</span>
                </div>
                <div>
                  <strong>{chef.diet}</strong>
                  <span>Food preference</span>
                </div>
                <div>
                  <strong>{money(chef.price)}</strong>
                  <span>Per-visit estimate</span>
                </div>
              </div>
              <section className="profile-section">
                <h2>A little about me</h2>
                <p>{chef.aboutCook}</p>
              </section>
              <section className="profile-section">
                <h2>What I love to cook</h2>
                <div className="tags">
                  {chef.cuisines.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </section>
              <section className="profile-section">
                <h2>The practical details</h2>
                <p>
                  <strong>Languages:</strong>{" "}
                  {chef.language.join(", ") || "Ask when planning your visit"}
                </p>
                <p>
                  <strong>Availability:</strong>{" "}
                  {chef.availability || "By arrangement"}
                </p>
                <p className="muted small">
                  Exact addresses and personal contact details are private.
                </p>
              </section>
            </div>
            <aside className="form-card booking-card">
              <p className="eyebrow">A LITTLE HELP IS ON THE WAY</p>
              <h2>Plan your visit</h2>
              <p className="muted">
                Starts from <strong>{money(chef.price)}</strong> per visit.
              </p>
              {user ? (
                <BookingForm
                  onSave={async (values) => {
                    await api("/bookings", {
                      method: "POST",
                      body: { ...values, chef: id },
                    });
                    navigate("/bookings", {
                      state: {
                        message:
                          "Your booking is saved. You can edit or cancel it here.",
                      },
                    });
                  }}
                />
              ) : (
                <>
                  <p>Sign in to choose your date and save your booking.</p>
                  <Link
                    className="btn full"
                    to="/login"
                    state={{ from: `/chef/${id}` }}
                  >
                    Sign in to book <Icon name="arrow" size={18} />
                  </Link>
                </>
              )}
            </aside>
          </div>
        )}
      </DataState>
    </div>
  );
}
