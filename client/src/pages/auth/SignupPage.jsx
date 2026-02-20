import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import { useAuth } from "@/state/auth.jsx";

function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Enter your name (min 2 chars).";
  if (!email || !email.includes("@")) errors.email = "Enter a valid email.";

  if (!password || password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(password)) errors.password = "Add at least 1 uppercase letter.";
  else if (!/[0-9]/.test(password)) errors.password = "Add at least 1 number.";

  if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

  return errors;
}

export default function SignupPage() {
  const nav = useNavigate();
  const { requestOtp } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => validate(form), [form]);
  const canSubmit = Object.keys(errors).length === 0 && !busy;

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!canSubmit) return;

    setBusy(true);
    try {
      await requestOtp({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      nav(`/verify-otp?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-300/90">
        We’ll send an OTP to your email for verification.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Full name"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched.name ? errors.name : ""}
          autoComplete="name"
        />

        <Input
          label="Email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email ? errors.email : ""}
          autoComplete="email"
          inputMode="email"
        />

        <Input
          label="Password"
          hint="Min 8 chars, 1 uppercase, 1 number"
          placeholder="••••••••"
          type="password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={touched.password ? errors.password : ""}
          autoComplete="new-password"
        />

        <Input
          label="Confirm password"
          placeholder="••••••••"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          autoComplete="new-password"
        />

        <Button type="submit" loading={busy} disabled={!canSubmit} className="w-full">
          Send OTP
        </Button>

        <div className="text-center text-sm text-slate-300/80">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-purple-300 hover:text-purple-200">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
