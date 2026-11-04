/** Reused by the profile page (POST) and My bookings (PUT).
 * datetime-local is converted to an ISO timestamp so the backend receives a timezone.
 */
import { useState } from "react";
import { Field, Notice } from "./UI";
import { serviceLabels } from "../services/api";
function localDate(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export default function BookingForm({ initial = {}, onSave, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      values.bookingDate = new Date(values.bookingDate).toISOString();
      values.guests = Number(values.guests);
      await onSave(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <Notice>{error}</Notice>
      <Field label="Service" name="service">
        <select
          name="service"
          id="service"
          defaultValue={initial.service || "one-time"}
        >
          {Object.entries(serviceLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Date and time"
        name="bookingDate"
        type="datetime-local"
        min={localDate(new Date())}
        defaultValue={initial.bookingDate ? localDate(initial.bookingDate) : ""}
        required
        hint="Displayed in your device’s local timezone."
      />
      <Field
        label="Number of people"
        name="guests"
        type="number"
        min="1"
        max="100"
        step="1"
        defaultValue={initial.guests || 2}
        required
      />
      <Field
        label="Cooking address"
        name="address"
        defaultValue={initial.address || ""}
        minLength={8}
        maxLength={500}
        placeholder="House, street, area and city"
        required
      />
      <Field label="Food preferences / notes" name="notes">
        <textarea
          id="notes"
          name="notes"
          defaultValue={initial.notes || ""}
          rows="3"
          maxLength={2000}
          placeholder="Meals, preferences, allergies, or anything your cook should know"
        />
      </Field>
      <div className="button-row">
        <button className="btn" disabled={busy}>
          {busy ? "Saving…" : initial._id ? "Save changes" : "Confirm booking"}
        </button>
        {onCancel && (
          <button className="btn secondary" type="button" onClick={onCancel}>
            Keep current booking
          </button>
        )}
      </div>
      <p className="footnote">
        No payment is collected. Monthly estimates cover 26 visits; party
        estimates are 3× a visit. Scheduling reserves the selected start time
        only.
      </p>
    </form>
  );
}
