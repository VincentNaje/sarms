"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginResult } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-lg bg-yellow-400 py-3 font-semibold text-[#1a1a1a] shadow-md transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
    >
      {pending ? "Logging in..." : "Login"}
    </button>
  );
}

function useCountdown(lockedUntil?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (!lockedUntil) return null;
  return Math.max(0, Math.round((new Date(lockedUntil).getTime() - now) / 1000));
}

export default function LoginForm() {
  const [state, formAction] = useActionState<LoginResult | undefined, FormData>(
    login,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);
  const secondsLeft = useCountdown(state?.lockedUntil);
  const isLocked = !!secondsLeft && secondsLeft > 0;

  const minutes = secondsLeft ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft ? secondsLeft % 60 : 0;

  return (
    <form action={formAction} className="max-w-sm space-y-5 ml-15">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-gray-200">
          Email:
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-white/20 bg-[#1a2133] px-3 py-2.5 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-gray-200">
          Password:
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/20 bg-[#1a2133] px-3 py-2.5 pr-10 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          ⚠ {state.error}
          {isLocked && (
            <>
              {" "}
              Try again in {minutes}:{seconds.toString().padStart(2, "0")}.
            </>
          )}
        </p>
      )}

      <SubmitButton disabled={isLocked} />

    
    </form>
  );
}