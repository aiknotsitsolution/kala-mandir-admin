import { useState } from "react";
import logo from "../images/Kalamandir Lotus Logo on Deep Plum.png";
import { apiRequest } from "../api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "forgot-password") {
        if (resetStep === "email") {
          const result = await apiRequest("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
          });
          setResetStep("otp");
          setOtp("");
          setNotice(result.message);
        } else if (resetStep === "otp") {
          const result = await apiRequest("/auth/verify-password-reset-otp", {
            method: "POST",
            body: JSON.stringify({ email, otp }),
          });
          setResetToken(result.resetToken);
          setResetStep("password");
          setPassword("");
          setConfirmPassword("");
          setNotice(result.message);
        } else {
          if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
          }
          const result = await apiRequest("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email, resetToken, password, confirmPassword }),
          });
          setMode("login");
          setResetStep("email");
          setResetToken("");
          setOtp("");
          setPassword("");
          setConfirmPassword("");
          setNotice(result.message);
        }
        return;
      }

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

  const resendPasswordResetOtp = async () => {
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const result = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setNotice(result.message);
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
        <h2>
          {mode === "forgot-password"
            ? resetStep === "otp"
              ? "Verify reset code"
              : resetStep === "password"
                ? "Set a new password"
                : "Forgot password?"
            : otpStep
              ? "Verify your email"
              : mode === "login"
                ? "Welcome back"
                : "Create your account"}
        </h2>
        <p className="subtitle">
          {mode === "forgot-password"
            ? resetStep === "otp"
              ? `Enter the 6-digit reset code sent to ${email}.`
              : resetStep === "password"
                ? "Choose a new password for your admin account."
                : "Enter your admin email and we'll send you a reset code."
            : otpStep
              ? `Enter the verification code sent to ${email}.`
              : mode === "login"
                ? "Sign in to manage gallery, photos & videos."
                : "Register to access the admin panel."}
        </p>
        {error && <div className="error-banner" role="alert">{error}</div>}
        {notice && <div className="success-banner" role="status">{notice}</div>}
        <form onSubmit={handleSubmit}>
          {mode === "register" && !otpStep && (
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
          {((mode === "forgot-password" && resetStep === "email") ||
            (mode !== "forgot-password" && !otpStep)) && (
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
          )}
          {mode === "login" && !otpStep && (
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  className="field password-field"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-visibility"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!showPassword && <path d="m4 4 16 16" />}
                  </svg>
                </button>
              </div>
            </div>
          )}
          {mode === "register" && !otpStep && (
            <div className="field-group">
              <label htmlFor="password">Password (at least 8 characters)</label>
              <div className="password-input">
                <input
                  className="field password-field"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-visibility"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {!showPassword && <path d="m4 4 16 16" />}
                  </svg>
                </button>
              </div>
            </div>
          )}
          {mode === "forgot-password" && resetStep === "password" && (
            <>
              <div className="field-group">
                <label htmlFor="password">New password (at least 8 characters)</label>
                <div className="password-input">
                  <input
                    className="field password-field"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-visibility"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showPassword && <path d="m4 4 16 16" />}
                    </svg>
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <div className="password-input">
                  <input
                    className="field password-field"
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-visibility"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showConfirmPassword && <path d="m4 4 16 16" />}
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
          {((mode === "login" && otpStep) ||
            (mode === "forgot-password" && resetStep === "otp")) && (
            <div className="field-group">
              <label htmlFor="otp">
                6-digit {mode === "login" ? "email verification" : "password reset"} code
              </label>
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
          {mode === "login" && !otpStep && (
            <p className="forgot-password-link">
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode("forgot-password");
                  setResetStep("email");
                  setError("");
                  setNotice("");
                }}
              >
                Forgot password?
              </button>
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "forgot-password"
                ? resetStep === "email"
                  ? "Send reset code"
                  : resetStep === "otp"
                    ? "Verify code"
                    : "Reset password"
                : otpStep
                  ? "Verify & Open Admin Panel →"
                  : mode === "login"
                    ? "Continue →"
                    : "Create Account"}
          </button>
        </form>
        {mode === "forgot-password" && resetStep === "otp" ? (
          <div className="login-footer otp-actions">
            <button
              type="button"
              className="text-button"
              onClick={resendPasswordResetOtp}
              disabled={submitting}
            >
              Resend code
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode("login");
                setResetStep("email");
                setOtp("");
                setError("");
                setNotice("");
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : mode === "forgot-password" ? (
          <p className="login-footer">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode("login");
                setResetStep("email");
                setResetToken("");
                setPassword("");
                setConfirmPassword("");
                setOtp("");
                setError("");
                setNotice("");
              }}
            >
              Back to sign in
            </button>
          </p>
        ) : otpStep ? (
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
                setPassword("");
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
