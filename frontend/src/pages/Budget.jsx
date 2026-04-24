import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Budget() {
  const navigate = useNavigate();

  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      toast.success("Notifications enabled 🔔");
      new Notification("SpendSense Zero", {
        body: "Budget alerts are now enabled.",
      });
    } else {
      toast.error("Notifications permission denied");
    }
  };

  const showBrowserNotification = (title, message) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
      });
    }
  };

  const playBudgetBeep = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        console.log("AudioContext not supported");
        return;
      }

      const audioContext = new AudioContext();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.22, startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;

      playTone(900, now, 0.25);
      playTone(650, now + 0.3, 0.3);
    } catch (error) {
      console.log("Beep sound error:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          toast.error("Please login again");
          navigate("/");
          return;
        }

        const [budgetRes, expenseRes] = await Promise.all([
          api.get("budgets/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("expenses/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setBudgets(budgetRes.data);
        setExpenses(expenseRes.data);

        const currentBudget = budgetRes.data.find(
          (b) => b.month === currentMonth
        );

        if (currentBudget) {
          setBudgetAmount(currentBudget.amount);
        }
      } catch (error) {
        console.log("Budget fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/");
        } else {
          toast.error("Could not load budget data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, currentMonth]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const totalSpent = useMemo(() => {
    return currentMonthExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );
  }, [currentMonthExpenses]);

  const currentBudgetValue = Number(budgetAmount || 0);
  const remaining = currentBudgetValue - totalSpent;

  const actualProgress =
    currentBudgetValue > 0 ? (totalSpent / currentBudgetValue) * 100 : 0;

  const progressBarWidth =
    currentBudgetValue > 0 ? Math.min(actualProgress, 100) : 0;

  const handleSaveBudget = async (e) => {
    e.preventDefault();

    if (!budgetAmount || Number(budgetAmount) <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        toast.error("Please login again");
        navigate("/");
        return;
      }

      const existingBudget = budgets.find((b) => b.month === currentMonth);

      if (existingBudget) {
        const res = await api.put(
          `budgets/${existingBudget.id}/`,
          {
            month: currentMonth,
            amount: Number(budgetAmount),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBudgets((prev) =>
          prev.map((item) => (item.id === existingBudget.id ? res.data : item))
        );

        toast.success("Budget updated successfully ✅");
      } else {
        const res = await api.post(
          "budgets/",
          {
            month: currentMonth,
            amount: Number(budgetAmount),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setBudgets((prev) => [...prev, res.data]);
        toast.success("Budget saved successfully ✅");
      }

      const updatedBudgetValue = Number(budgetAmount);
      const updatedRemaining = updatedBudgetValue - totalSpent;
      const updatedProgress =
        updatedBudgetValue > 0 ? (totalSpent / updatedBudgetValue) * 100 : 0;

      if (updatedProgress >= 100 || updatedRemaining < 0) {
        await playBudgetBeep();

        showBrowserNotification(
          "🚨 Budget Alert",
          "You have exceeded your monthly budget!"
        );

        toast.error("🚨 Budget exceeded! Please control your spending.");
      } else if (updatedProgress >= 90) {
        showBrowserNotification(
          "⚠️ Budget Warning",
          "You have used more than 90% of your monthly budget."
        );

        toast("⚠️ You have used 90%+ of your monthly budget.", {
          icon: "⚠️",
        });
      }

      navigate("/dashboard");
    } catch (error) {
      console.log("Budget save error:", error);

      if (error.response?.status === 401) {
        localStorage.clear();
        toast.error("Session expired. Please login again.");
        navigate("/");
      } else if (error.response?.data?.amount?.[0]) {
        toast.error(error.response.data.amount[0]);
      } else if (error.response?.data?.month?.[0]) {
        toast.error(error.response.data.month[0]);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Could not save budget");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading budget...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_28%)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Budget Planning</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Monthly Budget
            </h1>
            <p className="mt-2 text-slate-400">
              Set your monthly budget and get toast, sound, and browser
              notifications when spending goes over limit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {notificationPermission !== "granted" && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/20"
              >
                Enable Notifications 🔔
              </button>
            )}

            <Link
              to="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Budget</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{currentBudgetValue.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Spent</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{totalSpent.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <p className="text-sm text-slate-400">Remaining</p>
            <h3
              className={`mt-2 text-3xl font-bold ${
                remaining < 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              ₹{remaining.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold mb-6">
            Set Budget for {currentMonth}
          </h2>

          <form onSubmit={handleSaveBudget} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Budget Amount
              </label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Enter monthly budget"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-300">Budget Usage</p>
              <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${
                    actualProgress >= 100
                      ? "bg-red-500"
                      : actualProgress >= 90
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-blue-500 to-violet-500"
                  }`}
                  style={{ width: `${progressBarWidth}%` }}
                />
              </div>

              <p className="mt-2 text-sm text-slate-400">
                {actualProgress.toFixed(1)}% used
              </p>
            </div>

            {notificationPermission === "granted" && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-300">
                Browser notifications are enabled.
              </div>
            )}

            {actualProgress >= 90 && actualProgress < 100 && (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 text-yellow-300">
                ⚠️ Alert: You have used more than 90% of your monthly budget.
              </div>
            )}

            {remaining < 0 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-300">
                🚨 Warning: You have exceeded your monthly budget. Beep and
                notification will trigger when you save this budget.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Budget"}
              </button>

              {remaining < 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await playBudgetBeep();
                    showBrowserNotification(
                      "🚨 Budget Alert",
                      "This is a test budget notification."
                    );
                    toast.error("Test alert triggered 🚨");
                  }}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-3 font-semibold text-red-300 hover:bg-red-500/20"
                >
                  Test Alert 🔊
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}