import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import { useAuth } from "@/state/auth.jsx";
import toast from "react-hot-toast";

function validatePassword(password) {
  if (!password || password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least 1 uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least 1 number.";
  return "";
}

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { api } = useAuth();

  const email = (params.get("email") || "").trim().toLowerCase();

  const [form, setForm] = useState({ otp: "", password: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const e = {};
    if (!form.otp || !/^\d{4,8}$/.test(form.otp.trim())) e.otp = "Enter a valid OTP (4–8 digits).";
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  }, [form]);

  const canSubmit = email && Object.keys(errors).length === 0 && !busy;

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ otp: true, password: true, confirmPassword: true });
    if (!canSubmit) return;

    setBusy(true);
    const tId = toast.loading("Resetting password...");
    try {
      await api.post("/auth/reset-password", {
        email,
        otp: form.otp.trim(),
        newPassword: form.password
      });
      toast.success("Password reset successful! Please sign in.", { id: tId });
      nav("/login");
    } catch (e) {
      toast.error(e?.response?.data?.error || "Password reset failed", { id: tId });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) return toast.error("Missing email. Go back to forgot password.");
    setResendBusy(true);
    const tId = toast.loading("Resending OTP...");
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("OTP re-sent. Check your email.", { id: tId });
    } catch (e) {
      toast.error(e?.response?.data?.error || "Resend failed", { id: tId });
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">Reset password</h1>
      <p className="mt-1 text-sm text-slate-300/90">
        Enter the OTP sent to{" "}
        <span className="font-semibold text-slate-100">{email || "your email"}</span>{" "}
        and set a new password.
      </p>

      {!email ? (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Missing email in URL. Go back to{" "}
          <Link to="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>
          .
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="OTP"
          placeholder="Enter 6-digit OTP"
          value={form.otp}
          onChange={(e) => setField("otp", e.target.value.replace(/\D/g, ""))}
          onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
          error={touched.otp ? errors.otp : ""}
          inputMode="numeric"
          autoComplete="one-time-code"
        />

        <Input
          label="New password"
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
          label="Confirm new password"
          placeholder="••••••••"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          error={touched.confirmPassword ? errors.confirmPassword : ""}
          autoComplete="new-password"
        />

        <Button type="submit" loading={busy} disabled={!canSubmit} className="w-full">
          Reset Password
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300/80">
          <Link to="/forgot-password" className="font-semibold text-purple-300 hover:text-purple-200">
            Change email
          </Link>

          <button
            type="button"
            onClick={resend}
            disabled={resendBusy}
            className="font-semibold text-slate-200 hover:text-slate-100 disabled:opacity-60"
          >
            {resendBusy ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </form>
    </div>
  );
}
