import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Insights() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const fetchInsightsData = async () => {
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
        console.log("Insights fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/");
        } else {
          toast.error("Could not load insights");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsData();
  }, [navigate]);

  const totalSpending = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const averageExpense = useMemo(() => {
    if (!expenses.length) return 0;
    return totalSpending / expenses.length;
  }, [expenses, totalSpending]);

  const subscriptionSpending = useMemo(() => {
    return expenses
      .filter((exp) => exp.is_subscription)
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const highestExpense = useMemo(() => {
    if (!expenses.length) return null;
    return expenses.reduce((max, exp) =>
      Number(exp.amount) > Number(max.amount) ? exp : max
    );
  }, [expenses]);

  const categoryData = useMemo(() => {
    const grouped = {};

    expenses.forEach((exp) => {
      const category = exp.category_name || "Uncategorized";
      grouped[category] = (grouped[category] || 0) + Number(exp.amount);
    });

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const topCategory = categoryData[0] || null;

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
  const budgetUsage =
    budgetAmount > 0 ? (currentMonthSpent / budgetAmount) * 100 : 0;

  const smartMessages = useMemo(() => {
    const messages = [];

    if (!expenses.length) {
      messages.push({
        title: "Start tracking",
        text: "Add your first expense to unlock personalized insights.",
        tone: "blue",
      });
      return messages;
    }

    if (topCategory) {
      messages.push({
        title: "Top spending category",
        text: `You spend the most on ${topCategory.name}, with ₹${topCategory.amount.toFixed(
          2
        )} tracked so far.`,
        tone: "blue",
      });
    }

    if (highestExpense) {
      messages.push({
        title: "Highest expense",
        text: `Your highest expense is ${highestExpense.title} at ₹${Number(
          highestExpense.amount
        ).toFixed(2)}.`,
        tone: "violet",
      });
    }

    if (subscriptionSpending > 0) {
      messages.push({
        title: "Recurring cost watch",
        text: `Your subscription spending is ₹${subscriptionSpending.toFixed(
          2
        )}. Review recurring payments regularly.`,
        tone: "amber",
      });
    }

    if (budgetAmount > 0 && remainingBudget < 0) {
      messages.push({
        title: "Budget exceeded",
        text: `You have exceeded this month's budget by ₹${Math.abs(
          remainingBudget
        ).toFixed(2)}.`,
        tone: "red",
      });
    } else if (budgetAmount > 0) {
      messages.push({
        title: "Budget status",
        text: `You still have ₹${remainingBudget.toFixed(
          2
        )} remaining for this month.`,
        tone: "green",
      });
    }

    if (averageExpense > 0) {
      messages.push({
        title: "Average transaction",
        text: `Your average expense amount is ₹${averageExpense.toFixed(
          2
        )}. This helps you understand spending intensity.`,
        tone: "blue",
      });
    }

    return messages;
  }, [
    expenses,
    topCategory,
    highestExpense,
    subscriptionSpending,
    budgetAmount,
    remainingBudget,
    averageExpense,
  ]);

  const toneClass = (tone) => {
    if (tone === "red") {
      return "border-red-500/20 bg-red-500/10 text-red-300";
    }

    if (tone === "green") {
      return "border-green-500/20 bg-green-500/10 text-green-300";
    }

    if (tone === "amber") {
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    }

    if (tone === "violet") {
      return "border-violet-500/20 bg-violet-500/10 text-violet-300";
    }

    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_24%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Analytics</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Smart Insights
            </h1>
            <p className="mt-2 text-slate-400">
              Real spending observations generated from your expense and budget
              data.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Total Spending</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{totalSpending.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Average Expense</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{averageExpense.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Subscription Spending</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{subscriptionSpending.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Budget Usage</p>
            <h3
              className={`mt-2 text-3xl font-bold ${
                budgetUsage >= 100 ? "text-red-400" : "text-green-400"
              }`}
            >
              {budgetAmount > 0 ? `${budgetUsage.toFixed(1)}%` : "No budget"}
            </h3>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold">Smart Observations</h2>

            <div className="mt-6 grid gap-4">
              {smartMessages.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border p-5 ${toneClass(item.tone)}`}
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <p className="text-sm text-slate-400">Highest Expense</p>
              <h3 className="mt-2 text-2xl font-bold">
                {highestExpense ? highestExpense.title : "No data"}
              </h3>
              <p className="mt-2 text-slate-300">
                {highestExpense
                  ? `₹${Number(highestExpense.amount).toFixed(2)}`
                  : "Add expenses to see this insight."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <p className="text-sm text-slate-400">Top Category</p>
              <h3 className="mt-2 text-2xl font-bold">
                {topCategory ? topCategory.name : "No data"}
              </h3>
              <p className="mt-2 text-slate-300">
                {topCategory
                  ? `₹${topCategory.amount.toFixed(2)} tracked`
                  : "Add categorized expenses to unlock this."}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 p-6 shadow-xl">
              <p className="text-sm text-slate-300">Monthly Budget</p>
              <h3 className="mt-2 text-2xl font-bold">
                ₹{budgetAmount.toFixed(2)}
              </h3>
              <p className="mt-2 text-sm text-slate-300">
                Spent this month: ₹{currentMonthSpent.toFixed(2)}
              </p>
              <p
                className={`mt-2 text-sm ${
                  remainingBudget < 0 ? "text-red-300" : "text-green-300"
                }`}
              >
                Remaining: ₹{remainingBudget.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <h3 className="text-xl font-semibold">Category Summary</h3>

          {categoryData.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No category data available yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {categoryData.map((category) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4"
                >
                  <span className="text-slate-200">{category.name}</span>
                  <span className="font-semibold">
                    ₹{category.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}