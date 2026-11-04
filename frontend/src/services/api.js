/** The only place that talks HTTP. Screens receive {data}, or a useful Error.
 * Vite proxies /api in development; Express serves it in the built application.
 */
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("chefkart_token");
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach the server. Check that the backend is running, then retry.",
    );
  }
  if (response.status === 204) return { data: null };
  const payload = await response
    .json()
    .catch(() => ({ message: "The server returned an unreadable response." }));
  if (!response.ok) {
    // Invalid credentials on the login page are different from an expired session.
    if (response.status === 401 && !path.startsWith("/auth/login"))
      window.dispatchEvent(new Event("chefkart:session-expired"));
    throw Object.assign(new Error(payload.message || "Request failed."), {
      status: response.status,
    });
  }
  return payload;
}
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const serviceLabels = {
  "one-time": "One-time cook",
  monthly: "Cook for a month",
  party: "Chef for a party",
};
