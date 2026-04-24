import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("login/", {
        username: form.username.trim(),
        password: form.password,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      localStorage.setItem("username", form.username.trim());

      toast.success("Login successful 🚀");
      navigate("/dashboard");
    } catch (error) {
      console.log("Login error:", error);

      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.status === 401) {
        toast.error("Invalid username or password");
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_30%)]" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center px-16 xl:px-24">
          <div className="max-w-xl">
            <p className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 mb-6">
              Personal Finance • Smarter Tracking
            </p>

            <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                SpendSense Zero
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-8 mb-8">
              Track expenses, discover spending patterns, monitor subscriptions,
              and build better money habits with a clean modern dashboard.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400 mb-2">Smart Insights</p>
                <h3 className="text-xl font-semibold">Money Leak Detection</h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-slate-400 mb-2">Behavior Tracking</p>
                <h3 className="text-xl font-semibold">Mood-Based Spending</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-2xl shadow-lg">
                ₹
              </div>
              <h2 className="text-3xl font-bold">Login</h2>
              <p className="mt-2 text-sm text-slate-400">
                Sign in to continue to your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              New here?{" "}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}