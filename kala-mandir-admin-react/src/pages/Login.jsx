import { useState } from "react";
import logo from "../images/Kalamandir Lotus Logo on Deep Plum.png";
import { apiRequest } from "../api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const endpoint = otpStep
        ? "/auth/verify-otp"
        : `/auth/${mode === "login" ? "login" : "register"}`;
      const body = otpStep
        ? { email, otp }
        : { username, email, password };
      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (otpStep) {
        onLogin(result);
      } else if (mode === "register") {
        setMode("login");
        setPassword("");
        setNotice("Account created. Sign in to receive your email verification code.");
      } else {
        setOtpStep(true);
        setOtp("");
        setNotice(`A 6-digit verification code was sent to ${email}.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setNotice(result.message);
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
        <h2>{otpStep ? "Verify your email" : mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="subtitle">
          {otpStep
            ? `Enter the verification code sent to ${email}.`
            : mode === "login"
              ? "Sign in to manage gallery, photos & videos."
              : "Register to access the admin panel."}
        </p>
        {error && <div className="error-banner" role="alert">{error}</div>}
        {notice && <div className="success-banner" role="status">{notice}</div>}
        <form onSubmit={handleSubmit}>
          {!otpStep && mode === "register" && (
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
          {!otpStep && <div className="field-group">
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
          </div>}
          {!otpStep && <div className="field-group">
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
          </div>}
          {otpStep && (
            <div className="field-group">
              <label htmlFor="otp">6-digit email verification code</label>
              <input
                className="field otp-field"
                type="text"
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : otpStep
                ? "Verify & Open Admin Panel →"
                : mode === "login"
                  ? "Continue →"
                  : "Create Account"}
          </button>
        </form>
        {otpStep ? (
          <div className="login-footer otp-actions">
            <button type="button" className="text-button" onClick={resendOtp} disabled={submitting}>
              Resend code
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setOtpStep(false);
                setOtp("");
                setError("");
                setNotice("");
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <p className="login-footer">
            {mode === "login" ? "Need an account?" : "Already registered?"}{" "}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setError("");
                setNotice("");
                setMode((current) => (current === "login" ? "register" : "login"));
              }}
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
