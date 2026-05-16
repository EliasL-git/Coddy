import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { FolderOpen } from "lucide-react";

const LANG_COLORS = {
  html: "bg-orange-100 text-orange-700",
  css: "bg-blue-100 text-blue-700",
  javascript: "bg-yellow-100 text-yellow-800",
};

const DIFF_COLORS = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-700",
};

export default function AdminLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin
      .lessons()
      .then(setLessons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Group lessons by language for a cleaner display
  const byLang = lessons.reduce((acc, l) => {
    (acc[l.language] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold">Lessons</h1>
      </div>

      <p className="text-sm text-muted mb-6 flex items-center gap-1.5">
        <FolderOpen size={14} />
        Managed via{" "}
        <code className="bg-background border border-border rounded px-1 font-mono text-xs">
          lessons/&lt;language&gt;/&lt;course&gt;.json
        </code>
      </p>

      {error && <p className="text-wrong text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byLang).map(([lang, items]) => (
            <div
              key={lang}
              className="bg-surface border border-border rounded-2xl overflow-hidden"
            >
              {/* Language header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${LANG_COLORS[lang] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {lang}
                </span>
                <span className="text-sm text-muted">
                  {items.length} lesson{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-muted">
                    <th className="px-4 py-2 font-semibold">ID</th>
                    <th className="px-4 py-2 font-semibold">Title</th>
                    <th className="px-4 py-2 font-semibold">Unit</th>
                    <th className="px-4 py-2 font-semibold">Difficulty</th>
                    <th className="px-4 py-2 font-semibold">Order</th>
                    <th className="px-4 py-2 font-semibold">XP</th>
                    <th className="px-4 py-2 font-semibold">Challenges</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-border last:border-0 hover:bg-background transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-muted">
                        {l.id}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{l.title}</td>
                      <td className="px-4 py-2.5 text-muted">
                        {l.unit || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[l.difficulty] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {l.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{l.order}</td>
                      <td className="px-4 py-2.5">{l.xpReward}</td>
                      <td className="px-4 py-2.5">
                        {l.challenges?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {lessons.length === 0 && (
            <p className="text-muted text-sm">
              No lessons found. Add a JSON file to{" "}
              <code className="font-mono">lessons/&lt;language&gt;/</code>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
