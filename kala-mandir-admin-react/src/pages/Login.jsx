import { useState } from "react";
import logo from "../images/Kalamandir Lotus Logo on Deep Plum.png";
import { apiRequest } from "../api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await apiRequest(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });
      onLogin(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Kala Mandir — Art, Dance, Creativity" />
          <span>Admin Panel</span>
        </div>
        <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="subtitle">
          {mode === "login" ? "Sign in to manage gallery, photos & videos." : "Register to access the admin panel."}
        </p>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="field-group">
              <label htmlFor="username">Name</label>
              <input
                className="field"
                type="text"
                id="username"
                autoComplete="name"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
          )}
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              className="field"
              type="email"
              id="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password {mode === "register" && "(at least 8 characters)"}</label>
            <input
              className="field"
              type="password"
              id="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account"}
          </button>
        </form>
        <p className="login-footer">
          {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setError("");
              setMode((current) => (current === "login" ? "register" : "login"));
            }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
