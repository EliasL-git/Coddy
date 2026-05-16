import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  emoji: "🎁",
  coinCost: 100,
  stock: -1,
  active: true,
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  fulfilled: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminPrizes() {
  const [tab, setTab] = useState("prizes");

  // ── Prizes tab state ──────────────────────────────────
  const [prizes, setPrizes] = useState([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);
  const [editingPrize, setEditingPrize] = useState(null); // null=closed | 'new' | prize._id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Redemptions tab state ─────────────────────────────
  const [redemptions, setRedemptions] = useState([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [redemptionsLoaded, setRedemptionsLoaded] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Load prizes on mount
  useEffect(() => {
    loadPrizes();
  }, []);

  // Lazy-load redemptions when that tab is first opened
  useEffect(() => {
    if (tab === "redemptions" && !redemptionsLoaded) {
      loadRedemptions();
    }
  }, [tab]);

  async function loadPrizes() {
    setLoadingPrizes(true);
    try {
      const data = await api.admin.prizes();
      setPrizes(data);
    } catch {
      // silent
    } finally {
      setLoadingPrizes(false);
    }
  }

  async function loadRedemptions() {
    setLoadingRedemptions(true);
    try {
      const data = await api.admin.redemptions();
      setRedemptions(data);
      setRedemptionsLoaded(true);
    } catch {
      // silent
    } finally {
      setLoadingRedemptions(false);
    }
  }

  // ── Prize CRUD helpers ────────────────────────────────
  function openNew() {
    setForm(EMPTY_FORM);
    setEditingPrize("new");
    setSaveError("");
  }

  function openEdit(prize) {
    setForm({
      name: prize.name,
      description: prize.description,
      emoji: prize.emoji,
      coinCost: prize.coinCost,
      stock: prize.stock,
      active: prize.active,
    });
    setEditingPrize(prize._id);
    setSaveError("");
  }

  function cancelEdit() {
    setEditingPrize(null);
    setSaveError("");
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      if (editingPrize === "new") {
        await api.admin.createPrize(form);
      } else {
        await api.admin.updatePrize(editingPrize, form);
      }
      setEditingPrize(null);
      await loadPrizes();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(prize) {
    if (!window.confirm(`Delete "${prize.name}"? This cannot be undone.`))
      return;
    try {
      await api.admin.deletePrize(prize._id);
      await loadPrizes();
    } catch (err) {
      window.alert(err.message);
    }
  }

  // ── Redemption helpers ────────────────────────────────
  async function handleRedemptionUpdate(id, updates) {
    setUpdatingId(id);
    try {
      const updated = await api.admin.updateRedemption(id, updates);
      setRedemptions((prev) =>
        prev.map((r) => (r._id === id ? { ...r, ...updated } : r)),
      );
    } catch {
      // silent — UI keeps previous value; a toast system could be added here
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Shared tab button style ───────────────────────────
  function tabClass(name) {
    return `px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
      tab === name
        ? "bg-primary text-white"
        : "bg-background text-muted hover:text-foreground"
    }`;
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prizes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("prizes")}
            className={tabClass("prizes")}
          >
            Prizes
          </button>
          <button
            onClick={() => {
              setTab("redemptions");
              if (!redemptionsLoaded) loadRedemptions();
            }}
            className={tabClass("redemptions")}
          >
            Redemptions
          </button>
        </div>
      </div>

      {/* ════════════════════ PRIZES TAB ════════════════════ */}
      {tab === "prizes" && (
        <div>
          {/* New prize button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              New Prize
            </button>
          </div>

          {/* ── Create / Edit form panel ── */}
          {editingPrize !== null && (
            <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
              <h3 className="font-bold mb-4">
                {editingPrize === "new" ? "New Prize" : "Edit Prize"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Emoji */}
                <div>
                  <label className="block text-xs text-muted font-medium mb-1">
                    Emoji
                  </label>
                  <input
                    value={form.emoji}
                    onChange={(e) => setField("emoji", e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-2xl bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs text-muted font-medium mb-1">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Amazon Gift Card"
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted font-medium mb-1">
                    Description
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="$5 gift card redeemable on Amazon"
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Coin cost */}
                <div>
                  <label className="block text-xs text-muted font-medium mb-1">
                    Coin Cost
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.coinCost}
                    onChange={(e) =>
                      setField("coinCost", Number(e.target.value))
                    }
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs text-muted font-medium mb-1">
                    Stock{" "}
                    <span className="text-muted font-normal">
                      (-1 = unlimited)
                    </span>
                  </label>
                  <input
                    type="number"
                    min={-1}
                    value={form.stock}
                    onChange={(e) => setField("stock", Number(e.target.value))}
                    className="w-full border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Active checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeCheck"
                    checked={form.active}
                    onChange={(e) => setField("active", e.target.checked)}
                    className="accent-primary w-4 h-4"
                  />
                  <label htmlFor="activeCheck" className="text-sm font-medium">
                    Active (visible in shop)
                  </label>
                </div>
              </div>

              {saveError && (
                <p className="text-red-500 text-sm mt-3">{saveError}</p>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "Saving…" : "Save Prize"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Prizes table ── */}
          {loadingPrizes ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-left">
                    <th className="px-4 py-3 text-muted font-medium">Prize</th>
                    <th className="px-4 py-3 text-muted font-medium">Cost</th>
                    <th className="px-4 py-3 text-muted font-medium">Stock</th>
                    <th className="px-4 py-3 text-muted font-medium">Active</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prizes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-muted"
                      >
                        No prizes yet — create one above.
                      </td>
                    </tr>
                  ) : (
                    prizes.map((prize) => (
                      <tr
                        key={prize._id}
                        className="hover:bg-background transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-lg mr-2">{prize.emoji}</span>
                          <span className="font-semibold">{prize.name}</span>
                          {prize.description && (
                            <p className="text-xs text-muted mt-0.5">
                              {prize.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          🪙 {prize.coinCost}
                        </td>
                        <td className="px-4 py-3">
                          {prize.stock === -1 ? "∞" : prize.stock}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              prize.active
                                ? "bg-green-100 text-green-700"
                                : "bg-background text-muted border border-border"
                            }`}
                          >
                            {prize.active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(prize)}
                              title="Edit"
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(prize)}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ REDEMPTIONS TAB ════════════════════ */}
      {tab === "redemptions" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={loadRedemptions}
              disabled={loadingRedemptions}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingRedemptions ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loadingRedemptions ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-175">
                <thead>
                  <tr className="border-b border-border bg-background text-left">
                    <th className="px-4 py-3 text-muted font-medium">User</th>
                    <th className="px-4 py-3 text-muted font-medium">Prize</th>
                    <th className="px-4 py-3 text-muted font-medium">Coins</th>
                    <th className="px-4 py-3 text-muted font-medium">Date</th>
                    <th className="px-4 py-3 text-muted font-medium">Status</th>
                    <th className="px-4 py-3 text-muted font-medium">
                      Admin Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {redemptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-muted"
                      >
                        No redemptions yet.
                      </td>
                    </tr>
                  ) : (
                    redemptions.map((r) => (
                      <tr
                        key={r._id}
                        className="hover:bg-background transition-colors"
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="font-semibold">{r.username}</div>
                          <div className="text-xs text-muted">{r.email}</div>
                        </td>

                        {/* Prize */}
                        <td className="px-4 py-3">{r.prizeName}</td>

                        {/* Coins */}
                        <td className="px-4 py-3 font-medium">
                          🪙 {r.coinCost}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-muted whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Status dropdown — saves on change */}
                        <td className="px-4 py-3">
                          <select
                            value={r.status}
                            disabled={updatingId === r._id}
                            onChange={(e) =>
                              handleRedemptionUpdate(r._id, {
                                status: e.target.value,
                                adminNote: r.adminNote ?? "",
                              })
                            }
                            className={`border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                              STATUS_COLORS[r.status] ?? ""
                            }`}
                          >
                            <option value="pending">pending</option>
                            <option value="fulfilled">fulfilled</option>
                            <option value="rejected">rejected</option>
                          </select>
                        </td>

                        {/* Admin note — saves on blur if changed */}
                        <td className="px-4 py-3">
                          <input
                            key={r._id}
                            defaultValue={r.adminNote ?? ""}
                            onBlur={(e) => {
                              const newNote = e.target.value;
                              if (newNote !== (r.adminNote ?? "")) {
                                handleRedemptionUpdate(r._id, {
                                  status: r.status,
                                  adminNote: newNote,
                                });
                              }
                            }}
                            placeholder="Add a note…"
                            className="border border-border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary w-40"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
