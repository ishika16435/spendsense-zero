import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = [
  "#06b6d4",
  "#8b5cf6",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const fetchDashboardData = async () => {
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
        console.log("Dashboard fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/");
        } else {
          toast.error("Could not load dashboard data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const totalSubscriptions = useMemo(() => {
    return expenses
      .filter((item) => item.is_subscription)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const totalTransactions = expenses.length;
  const recentExpenses = expenses.slice(0, 5);

  const chartData = useMemo(() => {
    return [...expenses].reverse().map((item) => ({
      date: item.date,
      amount: Number(item.amount),
    }));
  }, [expenses]);

  const categoryChartData = useMemo(() => {
    const grouped = {};

    expenses.forEach((item) => {
      const key = item.category_name || "Uncategorized";
      grouped[key] = (grouped[key] || 0) + Number(item.amount);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  const topCategory = useMemo(() => {
    if (categoryChartData.length === 0) return "No data";

    return categoryChartData.reduce((max, item) =>
      item.value > max.value ? item : max
    ).name;
  }, [categoryChartData]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const currentMonthSpent = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
  }, [currentMonthExpenses]);

  const currentBudget = useMemo(() => {
    return budgets.find((b) => b.month === currentMonth);
  }, [budgets, currentMonth]);

  const budgetAmount = Number(currentBudget?.amount || 0);
  const remainingBudget = budgetAmount - currentMonthSpent;

  const actualBudgetPercent =
    budgetAmount > 0 ? (currentMonthSpent / budgetAmount) * 100 : 0;

  const budgetBarPercent =
    budgetAmount > 0 ? Math.min(actualBudgetPercent, 100) : 0;

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully 👋");
    navigate("/");
  };

  const statCardClass =
    "rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-white/20 hover:shadow-2xl";

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.10),transparent_24%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="border-r border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="mb-10">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              SpendSense Zero
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Smart personal finance tracker
            </p>
          </div>

          <nav className="space-y-3">
            <button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-left font-medium text-white shadow-md transition hover:opacity-90">
              Dashboard
            </button>

            <Link
              to="/expenses"
              className="block w-full rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-white/5"
            >
              Expenses
            </Link>

            <Link
              to="/add-expense"
              className="block w-full rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-white/5"
            >
              Add Expense
            </Link>

            <Link
              to="/budget"
              className="block w-full rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-white/5"
            >
              Budget
            </Link>

            <Link
              to="/insights"
              className="block w-full rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-white/5"
            >
              Insights
            </Link>

            <Link
              to="/profile"
              className="block w-full rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-white/5"
            >
              Profile
            </Link>
          </nav>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <p className="text-sm text-slate-400">Quick Summary</p>
            <h3 className="mt-2 text-xl font-semibold">
              {totalTransactions} Transactions
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Keep tracking to unlock better insights.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-300 transition hover:bg-white/10"
          >
            Logout
          </button>
        </aside>

        <main className="p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Financial Dashboard
              </h2>
              <p className="mt-2 text-slate-400">
                Track spending, monitor subscriptions, review activity, and
                manage your budget.
              </p>
            </div>

            <Link
              to="/add-expense"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:opacity-90"
            >
              + Add Expense
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Total Spending</p>
              <h3 className="mt-2 text-3xl font-bold">
                ₹{totalExpense.toFixed(2)}
              </h3>
            </div>

            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Transactions</p>
              <h3 className="mt-2 text-3xl font-bold">{totalTransactions}</h3>
            </div>

            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Subscriptions</p>
              <h3 className="mt-2 text-3xl font-bold">
                ₹{totalSubscriptions.toFixed(2)}
              </h3>
            </div>

            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Top Category</p>
              <h3 className="mt-2 text-2xl font-bold">{topCategory}</h3>
            </div>

            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Monthly Budget</p>
              <h3 className="mt-2 text-3xl font-bold">
                ₹{budgetAmount.toFixed(2)}
              </h3>
            </div>

            <div className={statCardClass}>
              <p className="text-sm text-slate-400">Remaining Budget</p>
              <h3
                className={`mt-2 text-3xl font-bold ${
                  remainingBudget < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                ₹{remainingBudget.toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Budget Overview</h3>
                <Link
                  to="/budget"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Manage budget
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-slate-900/60 p-4">
                  <p className="text-sm text-slate-400">Current Month</p>
                  <p className="mt-2 text-xl font-bold">{currentMonth}</p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-4">
                  <p className="text-sm text-slate-400">Spent This Month</p>
                  <p className="mt-2 text-xl font-bold">
                    ₹{currentMonthSpent.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/60 p-4">
                  <p className="text-sm text-slate-400">Usage</p>
                  <p className="mt-2 text-xl font-bold">
                    {budgetAmount > 0
                      ? `${actualBudgetPercent.toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm text-slate-300">Budget Progress</p>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full ${
                      actualBudgetPercent >= 100
                        ? "bg-red-500"
                        : actualBudgetPercent >= 90
                        ? "bg-yellow-500"
                        : "bg-gradient-to-r from-blue-500 to-violet-500"
                    }`}
                    style={{ width: `${budgetBarPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {budgetAmount > 0
                    ? `${actualBudgetPercent.toFixed(1)}% of budget used`
                    : "No monthly budget set"}
                </p>
              </div>

              {budgetAmount === 0 && (
                <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
                  You have not set a budget for this month yet.
                </div>
              )}

              {actualBudgetPercent >= 90 &&
                actualBudgetPercent < 100 &&
                budgetAmount > 0 && (
                  <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-300">
                    ⚠️ You have used more than 90% of your monthly budget.
                  </div>
                )}

              {remainingBudget < 0 && budgetAmount > 0 && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
                  🚨 Warning: You have exceeded your monthly budget. Open Budget
                  page to update your limit or review spending.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Category Breakdown</h3>
                <p className="text-sm text-slate-400">Pie chart</p>
              </div>

              {loading ? (
                <div className="flex h-72 items-center justify-center text-slate-400">
                  Loading pie chart...
                </div>
              ) : categoryChartData.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-slate-400">
                  <p className="text-lg font-medium">No category data</p>
                  <p className="mt-2 text-sm">
                    Add more expenses to compare categories.
                  </p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ percent }) =>
                          `${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Spending Overview</h3>
                <p className="text-sm text-slate-400">Expense trend chart</p>
              </div>

              {loading ? (
                <div className="flex h-72 items-center justify-center text-slate-400">
                  Loading chart...
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-slate-400">
                  <p className="text-lg font-medium">No chart data available</p>
                  <p className="mt-2 text-sm">
                    Add some expenses to see analytics.
                  </p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "1px solid #334155",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#8b5cf6"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
                <h3 className="text-xl font-semibold">Smart Insights</h3>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-900/60 p-4 text-slate-200">
                    You have added{" "}
                    <span className="font-semibold">{totalTransactions}</span>{" "}
                    transactions so far.
                  </div>

                  <div className="rounded-xl bg-slate-900/60 p-4 text-slate-200">
                    Subscription spending is{" "}
                    <span className="font-semibold text-violet-400">
                      ₹{totalSubscriptions.toFixed(2)}
                    </span>
                    .
                  </div>

                  <div className="rounded-xl bg-slate-900/60 p-4 text-slate-200">
                    Top spending category is{" "}
                    <span className="font-semibold text-blue-400">
                      {topCategory}
                    </span>
                    .
                  </div>

                  <div className="rounded-xl bg-slate-900/60 p-4 text-slate-200">
                    Current month spending is{" "}
                    <span className="font-semibold text-blue-400">
                      ₹{currentMonthSpent.toFixed(2)}
                    </span>
                    .
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 p-6 shadow-lg">
                <p className="text-sm text-slate-300">Growth Tip</p>
                <h3 className="mt-2 text-xl font-semibold">
                  Keep your monthly budget updated
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Tracking your budget alongside expenses gives you a much
                  clearer view of your financial habits and control.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Recent Expenses</h3>
              <p className="text-sm text-slate-400">
                Last {recentExpenses.length} records
              </p>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-400">
                Loading expenses...
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-slate-400">
                <p className="text-lg font-medium">No expenses added yet</p>
                <p className="mt-2 text-sm">
                  Start by adding your first expense.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-900/60 p-4 transition hover:bg-slate-800"
                  >
                    <div>
                      <p className="font-semibold text-white">{exp.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-400">
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span className="uppercase">
                          {exp.payment_method}
                        </span>
                        <span>•</span>
                        <span>{exp.category_name || "Uncategorized"}</span>
                        {exp.mood && (
                          <>
                            <span>•</span>
                            <span>{exp.mood}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        ₹{Number(exp.amount).toFixed(2)}
                      </p>
                      {exp.is_subscription && (
                        <p className="text-xs text-violet-400">
                          Subscription
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}