/** Customers can create one chef profile and edit/delete only their own profile. */
import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { DataState, Notice, PageHeading } from "../components/UI";
import ChefForm from "../components/ChefForm";
export default function RegisterChef() {
  const query = useApi("/chefs/mine");
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(values) {
    await api(query.data ? `/chefs/${query.data._id}` : "/chefs", {
      method: query.data ? "PUT" : "POST",
      body: values,
    });
    setMessage("Your cook profile is saved and visible in the directory.");
    query.reload();
  }
  async function remove() {
    if (!window.confirm("Delete your cook profile from the directory?")) return;
    setBusy(true);
    setError("");
    try {
      await api(`/chefs/${query.data._id}`, { method: "DELETE" });
      setMessage("Your profile has been deleted.");
      query.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page narrow">
      <PageHeading
        eyebrow="COOK WITH US"
        title={
          query.data ? "Your cook profile" : "Bring your skills to the table."
        }
      >
        Tell people about your cooking. Your contact details and street address
        remain private.
      </PageHeading>
      <Notice type="success">{message}</Notice>
      <Notice>{error}</Notice>
      <DataState query={query}>
        <div className="form-card">
          <ChefForm
            key={query.data?.updatedAt || "new"}
            initial={query.data || { name: user.name, email: user.email }}
            onSave={save}
          />
        </div>
        {query.data && (
          <button
            className="btn danger delete-profile"
            disabled={busy}
            onClick={remove}
          >
            Delete my profile
          </button>
        )}
      </DataState>
    </div>
  );
}
