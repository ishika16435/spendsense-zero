import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Expenses() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("access");

        if (!token) {
          toast.error("Please login again");
          navigate("/");
          return;
        }

        const res = await api.get("expenses/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setExpenses(res.data);
      } catch (error) {
        console.log("Expenses fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/");
        } else {
          toast.error("Could not load expenses");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [navigate]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [expenses]);

  const categories = useMemo(() => {
    return [...new Set(expenses.map((e) => e.category_name).filter(Boolean))];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = exp.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory = categoryFilter
        ? exp.category_name === categoryFilter
        : true;

      const matchesDate = dateFilter ? exp.date === dateFilter : true;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [expenses, search, categoryFilter, dateFilter]);

  const filteredTotalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [filteredExpenses]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Title",
      "Amount",
      "Category",
      "Date",
      "Payment Method",
      "Mood",
      "Subscription",
      "Notes",
    ];

    const rows = filteredExpenses.map((exp) => [
      exp.title,
      exp.amount,
      exp.category_name || "Uncategorized",
      exp.date,
      exp.payment_method,
      exp.mood || "",
      exp.is_subscription ? "Yes" : "No",
      exp.notes || "",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) => row.map(escapeCSV).join(","))
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileDate = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `expenses-${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("CSV downloaded 📁");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      const token = localStorage.getItem("access");

      if (!token) {
        toast.error("Please login again");
        navigate("/");
        return;
      }

      await api.delete(`expenses/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExpenses((prev) => prev.filter((item) => item.id !== id));
      toast.success("Expense deleted 🗑️");
    } catch (error) {
      console.log("Delete error:", error);

      if (error.response?.status === 401) {
        localStorage.clear();
        toast.error("Session expired. Please login again.");
        navigate("/");
      } else {
        toast.error("Could not delete expense");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setDateFilter("");
    toast.success("Filters cleared");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_24%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Expense Management
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              All Expenses
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              View, manage, search, export, and organize all your saved expenses
              in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Export CSV
            </button>

            <Link
              to="/add-expense"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + Add Expense
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:shadow-2xl">
            <p className="text-sm text-slate-400">Total Expenses</p>
            <h3 className="mt-2 text-3xl font-bold">
              {filteredExpenses.length}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:shadow-2xl">
            <p className="text-sm text-slate-400">Filtered Spending</p>
            <h3 className="mt-2 text-3xl font-bold">
              ₹{filteredTotalExpense.toFixed(2)}
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl transition hover:shadow-2xl">
            <p className="text-sm text-slate-400">Latest Record</p>
            <h3 className="mt-2 text-2xl font-bold">
              {filteredExpenses[0] ? filteredExpenses[0].title : "No data"}
            </h3>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-2xl font-bold">Expense List</h2>
            <p className="text-sm text-slate-400">
              {loading
                ? "Loading..."
                : `${filteredExpenses.length} records found`}
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search expense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={clearFilters}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Clear Filters
            </button>

            <button
              onClick={handleExportCSV}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Export Filtered CSV
            </button>

            {(search || categoryFilter || dateFilter) && (
              <p className="text-sm text-slate-400">Filters applied</p>
            )}
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center text-slate-400">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-slate-400">
              <p className="text-lg font-medium">No matching expenses found</p>
              <p className="mt-2 text-sm">
                Try changing your search or filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:bg-slate-800/80"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">
                          {exp.title}
                        </h3>

                        {exp.is_subscription && (
                          <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-300">
                            Subscription
                          </span>
                        )}

                        {exp.category_name && (
                          <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-300">
                            {exp.category_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span className="uppercase">{exp.payment_method}</span>
                        {exp.mood && (
                          <>
                            <span>•</span>
                            <span>{exp.mood}</span>
                          </>
                        )}
                      </div>

                      {exp.notes && (
                        <p className="mt-3 max-w-2xl text-sm text-slate-300">
                          {exp.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-2xl font-bold text-white">
                        ₹{Number(exp.amount).toFixed(2)}
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/edit-expense/${exp.id}`)}
                          className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deletingId === exp.id}
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === exp.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && expenses.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
              Total overall spending: ₹{totalExpense.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}