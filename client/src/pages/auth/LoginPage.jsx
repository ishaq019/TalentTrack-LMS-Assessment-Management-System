import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import { useAuth } from "@/state/auth.jsx";

function validate({ email, password }) {
  const errors = {};
  if (!email || !email.includes("@")) errors.email = "Enter a valid email.";
  if (!password || password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => validate(form), [form]);
  const canSubmit = Object.keys(errors).length === 0 && !busy;

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setBusy(true);
    try {
      const u = await login(form.email.trim().toLowerCase(), form.password);
      nav(u?.role === "admin" ? "/admin" : "/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-slate-300/90">
        Welcome back to <span className="font-semibold text-slate-100">TalentTrack</span>.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
          placeholder="••••••••"
          type="password"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={touched.password ? errors.password : ""}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-purple-300 hover:text-purple-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={busy} disabled={!canSubmit} className="w-full">
          Sign in
        </Button>

        <div className="text-center text-sm text-slate-300/80">
          Don’t have an account?{" "}
          <Link to="/signup" className="font-semibold text-purple-300 hover:text-purple-200">
            Create one
          </Link>
        </div>
      </form>

      <div className="mt-5 rounded-xl border border-slate-800/70 bg-slate-950/25 p-4 text-xs text-slate-300/80">
        <p className="font-semibold text-slate-200">Note</p>
        <p className="mt-1">
          Accounts sign in here like regular users. Admin access is granted by the
          TalentTrack team (seed/promotion). To request admin role, contact{" "}
          <a
            href="mailto:syedishaq0000786@gmail.com"
            className="font-semibold text-purple-300 hover:text-purple-200 underline"
          >
            syedishaq0000786@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
