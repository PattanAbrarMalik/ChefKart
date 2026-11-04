/** A small admin workspace for real REST operations.
 * UI visibility is convenience only: backend requireAdmin enforces permissions.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { DataState, Empty, Field, Notice, PageHeading } from "../components/UI";
import ChefForm from "../components/ChefForm";
const types = [
  "blogs",
  "testimonials",
  "services",
  "gallery",
  "carousel",
  "home",
  "food",
  "food-gallery",
  "investors",
  "join",
  "connect",
];
export default function Admin() {
  const [tab, setTab] = useState("content");
  const [type, setType] = useState("blogs");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const path =
    tab === "content"
      ? `/content/${type}`
      : tab === "chefs"
        ? "/chefs/manage"
        : "/leads";
  const query = useApi(path);
  const mutationPath = tab === "chefs" ? "/chefs" : path;
  async function mutate(method, url, body) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(url, { method, body });
      setMessage(method === "DELETE" ? "Record deleted." : "Changes saved.");
      setEditing(null);
      query.reload();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  }
  async function saveContent(event) {
    event.preventDefault();
    try {
      await mutate(
        editing?._id ? "PUT" : "POST",
        editing?._id ? `${path}/${editing._id}` : path,
        Object.fromEntries(new FormData(event.currentTarget)),
      );
    } catch {
      /* The shared notice already shows the server error. */
    }
  }
  function changeTab(value) {
    setTab(value);
    setEditing(null);
    setMessage("");
    setError("");
  }
  return (
    <div className="container page">
      <div className="section-heading">
        <PageHeading eyebrow="PROJECT WORKSPACE" title="Administration">
          Manage the records that power the website.
        </PageHeading>
        <Link to="/bookings" className="btn secondary">
          Manage bookings
        </Link>
      </div>
      <div className="tabs" aria-label="Admin sections">
        {["content", "chefs", "leads"].map((value) => (
          <button
            key={value}
            aria-pressed={tab === value}
            className={tab === value ? "active" : ""}
            onClick={() => changeTab(value)}
          >
            {value === "content"
              ? "Website content"
              : value === "chefs"
                ? "Cook profiles"
                : "Enquiries"}
          </button>
        ))}
      </div>
      <Notice>{error}</Notice>
      <Notice type="success">{message}</Notice>
      {tab === "content" && (
        <div className="admin-toolbar">
          <Field name="content-type" label="Content collection">
            <select
              id="content-type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setEditing(null);
              }}
            >
              {types.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Link className="text-link" to={`/explore/${type}`}>
            View collection →
          </Link>
          <button className="btn" onClick={() => setEditing({})}>
            Add content
          </button>
        </div>
      )}
      {tab === "chefs" && (
        <p className="muted">
          Create your own profile from{" "}
          <Link to="/register" className="text-link">
            cook registration
          </Link>
          , or edit existing profiles below.
        </p>
      )}
      {editing && (
        <section className="form-card admin-editor">
          <h2>{editing._id ? "Edit record" : "Create content"}</h2>
          {tab === "chefs" ? (
            <ChefForm
              key={editing._id}
              initial={editing}
              admin
              onCancel={() => setEditing(null)}
              onSave={(values) =>
                mutate("PUT", `/chefs/${editing._id}`, values)
              }
            />
          ) : (
            <form key={editing._id || `new-${type}`} onSubmit={saveContent}>
              <Field
                name="title"
                label="Title"
                defaultValue={editing.title || ""}
                maxLength={200}
                required
              />
              <Field
                name="category"
                label="Category"
                defaultValue={editing.category || ""}
                maxLength={100}
                hint={
                  type === "services"
                    ? "Use monthly, one-time, or party to appear on the corresponding service page."
                    : undefined
                }
              />
              <Field
                name="image"
                label="Image URL"
                defaultValue={editing.image || ""}
                maxLength={1000}
                hint="Use /assets/kitchen.png, an HTTPS URL, or leave blank."
              />
              <Field name="content" label="Content">
                <textarea
                  name="content"
                  id="content"
                  rows="6"
                  defaultValue={editing.content || ""}
                  maxLength={10000}
                  required
                />
              </Field>
              <div className="button-row">
                <button className="btn" disabled={busy}>
                  {busy ? "Saving…" : "Save content"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setEditing(null)}
                >
                  Cancel edit
                </button>
              </div>
            </form>
          )}
        </section>
      )}
      <DataState query={query}>
        {query.data?.length ? (
          <div className="admin-records">
            {query.data.map((row) => (
              <article className="admin-record" key={row._id}>
                <div>
                  <p className="eyebrow">
                    {tab === "leads"
                      ? `${row.type} · ${row.status}`
                      : tab === "chefs"
                        ? `${row.city} · ${row.verified ? "verified" : "not verified"}`
                        : row.category || type}
                  </p>
                  <h3>{row.title || row.name}</h3>
                  {tab === "leads" ? (
                    <>
                      <p className="small">
                        {row.email} · {row.city}
                        {row.phone ? ` · ${row.phone}` : ""}
                      </p>
                      <p className="prose">{row.message}</p>
                    </>
                  ) : (
                    <p className="muted small">
                      {(row.content || row.aboutCook || "").slice(0, 180)}
                    </p>
                  )}
                  <small className="muted record-id">ID: {row._id}</small>
                </div>
                <div className="button-row">
                  {tab === "leads" ? (
                    <button
                      className="btn small secondary"
                      disabled={busy}
                      onClick={() =>
                        mutate("PUT", `${path}/${row._id}`, {
                          status: row.status === "new" ? "resolved" : "new",
                        }).catch(() => {})
                      }
                    >
                      {row.status === "new" ? "Mark resolved" : "Reopen"}
                    </button>
                  ) : (
                    <button
                      className="btn small secondary"
                      onClick={() => {
                        setEditing(row);
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="btn small danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete this ${tab === "leads" ? "enquiry" : "record"} permanently?`,
                        )
                      )
                        mutate("DELETE", `${mutationPath}/${row._id}`).catch(
                          () => {},
                        );
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No records yet">New records will appear here.</Empty>
        )}
      </DataState>
    </div>
  );
}
