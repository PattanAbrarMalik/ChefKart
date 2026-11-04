/** One explicit form for both creating and editing a chef profile.
 * Comma-separated inputs become arrays before sending JSON to the backend.
 */
import { useState } from "react";
import { Field, Notice } from "./UI";
export default function ChefForm({
  initial = {},
  onSave,
  onCancel,
  admin = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.cuisines = values.cuisines
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    values.language = values.language
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    values.price = Number(values.price);
    values.experience = Number(values.experience);
    if (admin) values.verified = values.verified === "true";
    try {
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
      <div className="form-grid">
        <Field
          label="Full name"
          name="name"
          defaultValue={initial.name || ""}
          maxLength={100}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={initial.email || ""}
          maxLength={200}
          required
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone || ""}
          pattern="[+0-9 -]{10,15}"
          maxLength={15}
          required
        />
        <Field
          label="Experience (years)"
          name="experience"
          type="number"
          min="0"
          max="60"
          defaultValue={initial.experience ?? 0}
          required
        />
        <Field
          label="City"
          name="city"
          defaultValue={initial.city || ""}
          maxLength={100}
          required
        />
        <Field
          label="Area / neighbourhood"
          name="area"
          defaultValue={initial.area || ""}
          maxLength={150}
          required
        />
        <Field
          label="State"
          name="state"
          defaultValue={initial.state || ""}
          maxLength={100}
          required
        />
        <Field
          label="Country"
          name="country"
          defaultValue={initial.country || "India"}
          maxLength={100}
          required
        />
        <Field
          label="Street address (private)"
          name="address"
          defaultValue={initial.address || ""}
          maxLength={500}
          required
        />
        <Field
          label="Pincode"
          name="pincode"
          defaultValue={initial.pincode || ""}
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
        <Field
          label="Estimate per visit (₹)"
          name="price"
          type="number"
          min="100"
          max="100000"
          defaultValue={initial.price || 499}
          required
        />
        <Field label="Food preference" name="diet">
          <select
            id="diet"
            name="diet"
            defaultValue={initial.diet || "Vegetarian"}
          >
            <option>Vegetarian</option>
            <option>Both</option>
          </select>
        </Field>
        <Field
          label="Cuisines"
          name="cuisines"
          defaultValue={initial.cuisines?.join(", ") || ""}
          maxLength={500}
          placeholder="South Indian, North Indian"
          hint="Separate each cuisine with a comma."
        />
        <Field
          label="Languages"
          name="language"
          defaultValue={initial.language?.join(", ") || ""}
          maxLength={500}
          placeholder="Kannada, Hindi, English"
          hint="Separate each language with a comma."
        />
        <Field
          label="Available times"
          name="availability"
          defaultValue={initial.availability || ""}
          maxLength={200}
          placeholder="E.g. mornings 7–10, evenings 6–8"
        />
        <Field
          label="Profile image URL (optional)"
          name="profilepic"
          defaultValue={initial.profilepic || ""}
          maxLength={1000}
          placeholder="https://…"
          hint="Leave blank to show your initials. Image upload is not required."
        />
      </div>
      <Field label="About your cooking" name="aboutCook">
        <textarea
          name="aboutCook"
          id="aboutCook"
          defaultValue={initial.aboutCook || ""}
          rows="4"
          minLength={10}
          maxLength={2000}
          required
        />
      </Field>
      {admin && (
        <Field label="Verification status" name="verified">
          <select
            name="verified"
            id="verified"
            defaultValue={String(Boolean(initial.verified))}
          >
            <option value="false">Not verified</option>
            <option value="true">Verified by admin</option>
          </select>
        </Field>
      )}
      <div className="button-row">
        <button className="btn" disabled={busy}>
          {busy
            ? "Saving…"
            : initial._id
              ? "Save profile"
              : "Create cook profile"}
        </button>
        {onCancel && (
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
