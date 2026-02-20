import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "@/ui/components/Input.jsx";
import Button from "@/ui/components/Button.jsx";
import { useAuth } from "@/state/auth.jsx";
import toast from "react-hot-toast";

function isOtpValid(otp) {
  return /^[0-9]{4,8}$/.test(String(otp || "").trim());
}

export default function VerifyOtpPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { verifyOtp, api } = useAuth();

  const email = (params.get("email") || "").trim().toLowerCase();

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const canVerify = useMemo(() => email && isOtpValid(otp) && !busy, [email, otp, busy]);

  async function onVerify(e) {
    e.preventDefault();
    if (!canVerify) return toast.error("Enter a valid OTP (4–8 digits).");

    setBusy(true);
    try {
      const u = await verifyOtp({ email, otp: otp.trim() });
      nav(u?.role === "admin" ? "/admin" : "/dashboard");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) return toast.error("Missing email. Go back to signup.");

    setResendBusy(true);
    const tId = toast.loading("Resending OTP…");
    try {
      await api.post("/auth/resend-otp", { email });
      toast.success("OTP re-sent. Check your email.", { id: tId });
    } catch (e) {
      toast.error(e?.response?.data?.error || "Resend failed", { id: tId });
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight">Verify OTP</h1>
      <p className="mt-1 text-sm text-slate-300/90">
        Enter the OTP sent to{" "}
        <span className="font-semibold text-slate-100">{email || "your email"}</span>
      </p>

      {!email ? (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          Missing email in URL. Go back to{" "}
          <Link to="/signup" className="font-semibold underline">
            signup
          </Link>
          .
        </div>
      ) : null}

      <form onSubmit={onVerify} className="mt-6 space-y-4">
        <Input
          label="OTP"
          placeholder="Enter 4–8 digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
        />

        <Button type="submit" loading={busy} disabled={!canVerify} className="w-full">
          Verify & Continue
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm text-slate-300/80">
          <Link to="/signup" className="font-semibold text-purple-300 hover:text-purple-200">
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

      <div className="mt-5 rounded-xl border border-slate-800/70 bg-slate-950/25 p-4 text-xs text-slate-300/80">
        <p className="font-semibold text-slate-200">Backend requirement</p>
        <p className="mt-1">
          Needs: <span className="font-mono text-slate-100">POST /auth/signup/resend-otp</span>{" "}
          with <span className="font-mono text-slate-100">{`{ email }`}</span>.
        </p>
      </div>
    </div>
  );
}
