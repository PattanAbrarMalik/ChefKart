/** Contact/career/investor forms all submit to the private enquiries collection. */
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Field, Icon, Notice, PageHeading } from "../components/UI";
export default function Contact({ type = "contact" }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const heading = {
    contact: "Let’s talk about your kitchen.",
    career: "Bring your ideas to the table.",
    investor: "Start a conversation.",
  }[type];
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api("/leads", {
        method: "POST",
        body: { ...Object.fromEntries(new FormData(form)), type },
      });
      setMessage(
        `Enquiry saved. Reference: ${result.data._id}. It is now available to the administrator.`,
      );
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <div className="contact-grid">
        <div>
          <PageHeading
            eyebrow={
              type === "contact"
                ? "WE’RE ALL EARS"
                : type === "career"
                  ? "CAREERS"
                  : "INVESTOR ENQUIRIES"
            }
            title={heading}
          >
            {type === "career"
              ? "Tell us about your interests and experience. This form records an expression of interest, not a confirmed job application."
              : "A question, an idea, or a little help getting started? Leave a message."}
          </PageHeading>
          <div className="contact-note">
            <Icon name="bowl" size={40} />
            <h3>Good conversations start here.</h3>
            <p>
              Your message is saved securely for the project administrator. This
              local project does not send email or SMS automatically.
            </p>
          </div>
        </div>
        <div className="form-card">
          <h2>Send an enquiry</h2>
          <p className="muted small">Fields marked * are required.</p>
          <Notice>{error}</Notice>
          <Notice type="success">{message}</Notice>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field
                name="name"
                label="Full name"
                defaultValue={user?.name || ""}
                maxLength={100}
                required
              />
              <Field
                name="email"
                label="Email address"
                type="email"
                defaultValue={user?.email || ""}
                maxLength={200}
                required
              />
              <Field
                name="phone"
                label="Phone (optional)"
                type="tel"
                pattern="[+0-9 -]{10,15}"
                maxLength={15}
              />
              <Field name="city" label="City" maxLength={100} required />
            </div>
            <Field name="area" label="Area (optional)" maxLength={150} />
            <Field name="message" label="How can we help?">
              <textarea
                id="message"
                name="message"
                rows="5"
                minLength={5}
                maxLength={3000}
                required
              />
            </Field>
            <button className="btn full" disabled={busy}>
              {busy ? "Sending…" : "Send enquiry"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
