import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddExpense() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    payment_method: "upi",
    notes: "",
    is_subscription: false,
    mood: "",
  });

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          navigate("/");
          return;
        }

        const res = await api.get("categories/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCategories(res.data);
      } catch (error) {
        console.log("Category fetch error:", error);
        toast.error("Could not load categories");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setAddingCategory(true);

      const token = localStorage.getItem("access");

      if (!token) {
        toast.error("Please login again");
        navigate("/");
        return;
      }

      const res = await api.post(
        "categories/",
        {
          name: newCategory.trim(),
          type: "expense",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCategories((prev) => [...prev, res.data]);
      setForm((prev) => ({ ...prev, category: String(res.data.id) }));
      setNewCategory("");

      toast.success("Category added successfully ✅");
    } catch (error) {
      console.log("Add category error:", error);
      toast.error(
        error.response?.data?.name?.[0] ||
          error.response?.data?.detail ||
          "Could not create category"
      );
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter expense title");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!form.date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access");

      if (!token) {
        toast.error("Please login again");
        navigate("/");
        return;
      }

      await api.post(
        "expenses/",
        {
          title: form.title.trim(),
          amount: Number(form.amount),
          category: form.category ? Number(form.category) : null,
          date: form.date,
          payment_method: form.payment_method,
          notes: form.notes,
          is_subscription: form.is_subscription,
          mood: form.mood || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Expense saved successfully 💰");
      navigate("/dashboard");
    } catch (error) {
      console.log("Expense save error:", error);
      console.log("Response:", error.response?.data);

      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.amount?.[0] ||
          error.response?.data?.date?.[0] ||
          error.response?.data?.title?.[0] ||
          "Error saving expense"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_28%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Expense Management
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Add New Expense
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Record a transaction, assign a category, tag spending behavior,
              and keep your dashboard analytics meaningful.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Expense Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Swiggy dinner, metro recharge, Netflix"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="amount"
                      placeholder="450"
                      value={form.amount}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3.5 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">
                      {categoryLoading
                        ? "Loading categories..."
                        : "Select category"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Payment Method
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <label className="mb-3 block text-sm font-medium text-slate-300">
                  Create New Category
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="e.g. Food, Travel, Recharge"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  />

                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory}
                    className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingCategory ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Mood Tag
                  </label>
                  <select
                    name="mood"
                    value={form.mood}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select mood</option>
                    <option value="fun">Fun</option>
                    <option value="stress">Stress</option>
                    <option value="impulse">Impulse</option>
                    <option value="need">Need</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-4 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      name="is_subscription"
                      checked={form.is_subscription}
                      onChange={handleChange}
                      className="h-4 w-4 rounded accent-violet-500"
                    />
                    Mark this as a subscription expense
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="5"
                  placeholder="Add transaction details, reason for spending, or anything useful..."
                  value={form.notes}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Save Expense"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
              <p className="text-sm font-medium text-slate-400">Quick Tips</p>
              <h3 className="mt-2 text-2xl font-bold">Track smarter</h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-300">
                  Use clear titles like “Uber to office” instead of generic
                  names.
                </div>
                <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-300">
                  Create categories properly to unlock better pie chart
                  analytics.
                </div>
                <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-300">
                  Mark recurring payments like Netflix, rent, or recharge as
                  subscriptions.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-violet-600/20 p-6 shadow-xl">
              <p className="text-sm text-slate-300">Pro insight</p>
              <h3 className="mt-2 text-xl font-semibold">
                Good categories = better analytics
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Once you save expenses with real categories, your dashboard will
                show more meaningful breakdowns, top categories, and spending
                patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}