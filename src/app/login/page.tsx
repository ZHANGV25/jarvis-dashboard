"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-8 w-full max-w-sm shadow-sm"
      >
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
            <span className="text-white dark:text-zinc-900 font-bold text-lg">J</span>
          </div>
        </div>
        <h1 className="text-zinc-900 dark:text-zinc-100 text-lg font-semibold text-center tracking-tight">
          Welcome back
        </h1>
        <p className="text-zinc-400 text-[13px] mb-6 text-center">
          Enter your password to continue
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-[14px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 mb-4 transition-shadow"
        />
        {error && (
          <p className="text-red-500 text-[13px] mb-3 text-center">
            Incorrect password
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium rounded-xl py-3 text-[14px] hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
