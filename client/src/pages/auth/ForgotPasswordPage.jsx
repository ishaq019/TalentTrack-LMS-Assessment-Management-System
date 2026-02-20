import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import { useAuth } from "@/state/auth.jsx";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const { api } = useAuth();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  const error = useMemo(() => {
    if (!email || !email.includes("@")) return "Enter a valid email.";
    return "";
  }, [email]);

  const canSubmit = !error && !busy;

  async function onSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    setBusy(true);
    const tId = toast.loading("Sending reset OTP...");
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      toast.success("OTP sent to your email.", { id: tId });
      nav(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to send reset OTP", { id: tId });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">Forgot password</h1>
      <p className="mt-1 text-sm text-slate-300/90">
        Enter your registered email and we'll send an OTP to reset your password.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? error : ""}
          autoComplete="email"
          inputMode="email"
        />

        <Button type="submit" loading={busy} disabled={!canSubmit} className="w-full">
          Send Reset OTP
        </Button>

        <div className="text-center text-sm text-slate-300/80">
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-purple-300 hover:text-purple-200">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
