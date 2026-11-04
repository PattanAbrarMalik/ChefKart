/** Bookings are fetched from the server, never simulated in browser storage. */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api, money, serviceLabels } from "../services/api";
import { DataState, Empty, Notice, PageHeading } from "../components/UI";
import BookingForm from "../components/BookingForm";
import { useAuth } from "../context/AuthContext";
export default function Bookings() {
  const query = useApi("/bookings");
  const location = useLocation();
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [busy, setBusy] = useState("");
  async function change(row, method, body, success) {
    setBusy(row._id);
    setError("");
    setMessage("");
    try {
      await api(`/bookings/${row._id}`, { method, body });
      setMessage(success);
      query.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow="YOUR KITCHEN PLANS"
        title={user.role === "admin" ? "All bookings" : "My bookings"}
      >
        View your plans, update the details, or make room for a different day.
      </PageHeading>
      <Notice>{error}</Notice>
      <Notice type="success">{message}</Notice>
      <DataState query={query}>
        {query.data?.length ? (
          <div className="booking-list">
            {query.data.map((row) => (
              <article key={row._id} className="booking-row">
                <div className="booking-summary">
                  <div>
                    <p className="eyebrow">{serviceLabels[row.service]}</p>
                    <h3>{row.chefName}</h3>
                    <p>
                      {new Date(row.bookingDate).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="muted small">
                      {row.address} · {row.guests} people
                    </p>
                    {row.notes && (
                      <p className="muted small">Notes: {row.notes}</p>
                    )}
                  </div>
                  <div className="booking-meta">
                    <span className={`status ${row.status}`}>{row.status}</span>
                    <strong>{money(row.estimatedPrice)}</strong>
                    <small className="muted">Estimated total</small>
                  </div>
                </div>
                {editing === row._id ? (
                  <div className="booking-edit">
                    <BookingForm
                      initial={row}
                      onCancel={() => setEditing(null)}
                      onSave={async (values) => {
                        await api(`/bookings/${row._id}`, {
                          method: "PUT",
                          body: values,
                        });
                        setEditing(null);
                        setMessage("Booking updated.");
                        query.reload();
                      }}
                    />
                  </div>
                ) : (
                  <div className="button-row">
                    <Link to={`/chef/${row.chef}`} className="text-link">
                      View cook
                    </Link>
                    {row.status === "booked" ? (
                      <>
                        <button
                          className="btn small secondary"
                          onClick={() => setEditing(row._id)}
                        >
                          Edit booking
                        </button>
                        <button
                          className="btn small danger"
                          disabled={busy === row._id}
                          onClick={() => {
                            if (window.confirm("Cancel this booking?"))
                              change(
                                row,
                                "PUT",
                                { status: "cancelled" },
                                "Booking cancelled.",
                              );
                          }}
                        >
                          Cancel booking
                        </button>
                        {user.role === "admin" && (
                          <button
                            className="btn small secondary"
                            disabled={busy === row._id}
                            onClick={() =>
                              change(
                                row,
                                "PUT",
                                { status: "completed" },
                                "Booking marked complete.",
                              )
                            }
                          >
                            Mark complete
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        className="btn small danger"
                        disabled={busy === row._id}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Permanently delete this closed booking?",
                            )
                          )
                            change(
                              row,
                              "DELETE",
                              undefined,
                              "Booking deleted.",
                            );
                        }}
                      >
                        Delete record
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty title="A delicious plan starts here">
            <Link className="btn" to="/chef-search">
              Find your cook
            </Link>
          </Empty>
        )}
      </DataState>
      <div className="inline-callout">
        <p>Want to share your own cooking skills?</p>
        <Link to="/register" className="text-link">
          Manage your cook profile →
        </Link>
      </div>
    </div>
  );
}
