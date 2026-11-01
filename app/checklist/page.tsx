"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, shortLabel, timeLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { PageHeader } from "@/components/Ui";
import type { ChecklistItem, ChecklistState } from "@/lib/types";
import { DEFAULT_CHECKLIST_ITEMS as DEFAULT_ITEMS } from "@/lib/knowledge";

export default function ChecklistPage() {
  const { me, isAdmin } = useMember();
  const sunday = getSundays(1)[0];
  const sundayIso = isoDate(sunday);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [state, setState] = useState<Record<string, ChecklistState>>({});
  const [newItem, setNewItem] = useState("");
  const [editingItems, setEditingItems] = useState(false);
  const [loading, setLoading] = useState(true);

  async function ensureDefaultItems() {
    const { data } = await supabase.from("checklist_items").select("id");
    if ((data ?? []).length === 0) {
      await supabase
        .from("checklist_items")
        .insert(DEFAULT_ITEMS.map((text, position) => ({ text, position })));
    }
  }

  async function loadItems() {
    const { data } = await supabase.from("checklist_items").select("*").order("position");
    setItems((data as ChecklistItem[]) ?? []);
  }

  async function loadState() {
    const { data } = await supabase.from("checklist_state").select("*").eq("sunday", sundayIso);
    const map: Record<string, ChecklistState> = {};
    (data as ChecklistState[] ?? []).forEach((row) => (map[row.item_id] = row));
    setState(map);
  }

  useEffect(() => {
    (async () => {
      await ensureDefaultItems();
      await Promise.all([loadItems(), loadState()]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`checklist-${sundayIso}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_items" }, loadItems)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_state", filter: `sunday=eq.${sundayIso}` },
        loadState
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sundayIso]);

  const doneCount = items.filter((it) => state[it.id]?.done).length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  async function toggle(item: ChecklistItem) {
    if (!me) return;
    const isDone = !state[item.id]?.done;
    await supabase.from("checklist_state").upsert(
      {
        sunday: sundayIso,
        item_id: item.id,
        done: isDone,
        done_by: isDone ? me : null,
        done_at: isDone ? new Date().toISOString() : null,
      },
      { onConflict: "sunday,item_id" }
    );
  }

  async function addItem() {
    if (!newItem.trim()) return;
    await supabase.from("checklist_items").insert({ text: newItem.trim(), position: items.length });
    setNewItem("");
  }

  async function removeItem(id: string) {
    await supabase.from("checklist_items").delete().eq("id", id);
  }

  return (
    <div>
      <PageHeader
        eyebrow={shortLabel(sunday)}
        title="Sunday Checklist"
        right={
          isAdmin ? (
            <button
              onClick={() => setEditingItems(!editingItems)}
              className="btn btn-secondary"
            >
              <Pencil size={14} /> {editingItems ? "Done editing" : "Edit list"}
            </button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <div className="h-2 rounded-full bg-panel-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct === 100 ? "var(--ok)" : "var(--tally)" }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {doneCount} of {items.length} done · {pct}%
        </p>
      </div>

      {!loading && (
        <div className="space-y-2">
          {items.map((item) => {
            const s = state[item.id];
            return (
              <div key={item.id} className="flex items-center gap-3 card px-4 py-3">
                <button
                  onClick={() => toggle(item)}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-colors"
                  style={{
                    borderColor: s?.done ? "var(--ok)" : "var(--muted-2)",
                    background: s?.done ? "var(--ok)" : "transparent",
                  }}
                >
                  {s?.done && <Check size={15} color="#0a1f16" />}
                </button>
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: s?.done ? "var(--muted)" : "var(--text)",
                    textDecoration: s?.done ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </span>
                {s?.done && s.done_at && (
                  <span className="text-xs text-muted-2 shrink-0 hidden sm:inline">
                    {s.done_by} · {timeLabel(s.done_at)}
                  </span>
                )}
                {editingItems && (
                  <button onClick={() => removeItem(item.id)} className="text-muted-2 hover:text-tally shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingItems && (
        <div className="flex gap-2 mt-3">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add a checklist item"
            className="field flex-1"
          />
          <button onClick={addItem} className="btn btn-secondary">
            Add
          </button>
        </div>
      )}
    </div>
  );
}
