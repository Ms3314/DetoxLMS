import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { validateEmail, validatePassword, validateUsername } from "../auth/validation";

type Mode = "login" | "signup";

/** Email + password login and sign-up. Guests can still use the app without either. */
export default function AuthView() {
  const { configured, loading, user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/profile" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const problem =
      validateEmail(email) ??
      (mode === "signup" ? validateUsername(username) : null) ??
      (mode === "signup" ? validatePassword(password) : password ? null : "Enter your password.");
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        const { needsConfirmation } = await signUp(email, password, username);
        if (needsConfirmation) {
          setNotice("Account created. Check your email for a confirmation link, then log in.");
          setMode("login");
          setPassword("");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="view auth-view">
      <div className="view-head">
        <div>
          <p className="kicker">Account</p>
          <h2 className="view-title">{mode === "login" ? "Log in" : "Create your account"}</h2>
        </div>
      </div>

      {!configured && (
        <p className="auth-message" role="status">
          Accounts aren't set up on this site yet, so logging in isn't available. You can still focus as a
          guest; your hours stay in this browser.
        </p>
      )}

      <form className="auth-form" onSubmit={submit} noValidate>
        <label className="focus-field">
          <span className="kicker">Email</span>
          <input
            className="todo-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!configured || busy}
          />
        </label>

        {mode === "signup" && (
          <label className="focus-field">
            <span className="kicker">Username</span>
            <input
              className="todo-input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!configured || busy}
            />
            <span className="auth-hint">3-20 letters, numbers or underscores. Shown on your profile.</span>
          </label>
        )}

        <label className="focus-field">
          <span className="kicker">Password</span>
          <input
            className="todo-input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured || busy}
          />
          {mode === "signup" && <span className="auth-hint">At least 8 characters.</span>}
        </label>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="auth-message" role="status">
            {notice}
          </p>
        )}

        <button type="submit" className="btn-accent auth-submit" disabled={!configured || busy || loading}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? "New here?" : "Already have an account?"}{" "}
        <button type="button" className="auth-link" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </div>
  );
}
