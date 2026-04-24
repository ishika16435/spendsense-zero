import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          toast.error("Please login again");
          navigate("/");
          return;
        }

        const [expenseRes, budgetRes] = await Promise.all([
          api.get("expenses/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("budgets/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setExpenses(expenseRes.data);
        setBudgets(budgetRes.data);
      } catch (error) {
        console.log("Profile fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/");
        } else {
          toast.error("Could not load profile data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const totalSpending = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const subscriptionSpending = useMemo(() => {
    return expenses
      .filter((exp) => exp.is_subscription)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.date?.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const currentMonthSpent = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    );
  }, [currentMonthExpenses]);

  const currentBudget = useMemo(() => {
    return budgets.find((budget) => budget.month === currentMonth);
  }, [budgets, currentMonth]);

  const budgetAmount = Number(currentBudget?.amount || 0);
  const remainingBudget = budgetAmount - currentMonthSpent;

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully 👋");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_24%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Account</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Profile</h1>
            <p className="mt-2 text-slate-400">
              Manage your account details and financial activity summary.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-violet-500 text-4xl font-bold shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>

            <h3 className="mt-5 text-center text-3xl font-bold">{username}</h3>

            <p className="mt-2 text-center text-sm text-slate-400">
              SpendSense Zero User
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm text-slate-400">Current Month</p>
              <h4 className="mt-2 text-2xl font-bold">{currentMonth}</h4>
              <p className="mt-2 text-sm text-slate-400">
                Budget and spending overview
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-xl font-semibold">Profile Details</h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Username</p>
                <p className="mt-2 font-semibold text-white">{username}</p>
              </div>

              <div className="rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">App Role</p>
                <p className="mt-2 font-semibold text-white">
                  Personal Finance User
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Project Type</p>
                <p className="mt-2 font-semibold text-white">
                  Learning + Portfolio Project
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Account Status</p>
                <p className="mt-2 font-semibold text-green-400">Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
            <p className="text-sm text-slate-400">Total Transactions</p>
            <h3 className="mt-2 text-3xl font-bold">{expenses.length}</h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
            <p className="text-sm text-slate-400">Total Spending</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{totalSpending.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
            <p className="text-sm text-slate-400">Subscription Spending</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{subscriptionSpending.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
            <p className="text-sm text-slate-400">Monthly Budget</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{budgetAmount.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Monthly Summary</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your current month spending and remaining budget.
              </p>
            </div>

            <Link
              to="/budget"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Manage Budget
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/60 p-5">
              <p className="text-sm text-slate-400">Spent This Month</p>
              <p className="mt-2 text-2xl font-bold">
                ₹{currentMonthSpent.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 p-5">
              <p className="text-sm text-slate-400">Budget</p>
              <p className="mt-2 text-2xl font-bold">
                ₹{budgetAmount.toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 p-5">
              <p className="text-sm text-slate-400">Remaining</p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  remainingBudget < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                ₹{remainingBudget.toFixed(2)}
              </p>
            </div>
          </div>

          {budgetAmount === 0 && (
            <div className="mt-5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
              You have not set a budget for this month yet.
            </div>
          )}

          {budgetAmount > 0 && remainingBudget < 0 && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              You have exceeded your monthly budget. Review your recent
              expenses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}