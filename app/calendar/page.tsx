"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSundays, isoDate, shortLabel } from "@/lib/dates";
import { useMember } from "@/components/MemberProvider";
import { PageHeader } from "@/components/Ui";
import type { Assignment, Role } from "@/lib/types";

export default function CalendarPage() {
  const { me, isAdmin, roster } = useMember();
  const sundays = getSundays(10);
  const sundayIsos = sundays.map(isoDate);

  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [managingRoles, setManagingRoles] = useState(false);
  const [newRole, setNewRole] = useState("");

  async function loadRoles() {
    const { data } = await supabase.from("roles").select("*").order("position");
    setRoles((data as Role[]) ?? []);
  }

  async function loadAssignments() {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .in("sunday", sundayIsos);
    setAssignments((data as Assignment[]) ?? []);
  }

  useEffect(() => {
    loadRoles();
    loadAssignments();

    const channel = supabase
      .channel("calendar-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "roles" }, loadRoles)
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, loadAssignments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function assign(sunday: string, roleId: string, memberName: string) {
    if (!memberName) {
      await supabase.from("assignments").delete().eq("sunday", sunday).eq("role_id", roleId);
      return;
    }
    await supabase
      .from("assignments")
      .upsert(
        { sunday, role_id: roleId, member_name: memberName, assigned_by: me },
        { onConflict: "sunday,role_id" }
      );
  }

  async function addRole() {
    if (!newRole.trim()) return;
    await supabase.from("roles").insert({ name: newRole.trim(), position: roles.length });
    setNewRole("");
  }

  async function removeRole(id: string) {
    await supabase.from("roles").delete().eq("id", id);
  }

  function assignmentFor(sunday: string, roleId: string) {
    return assignments.find((a) => a.sunday === sunday && a.role_id === roleId)?.member_name ?? "";
  }

  return (
    <div>
      <PageHeader
        eyebrow="Who's assigned where"
        title="Calendar"
        right={
          isAdmin ? (
            <button
              onClick={() => setManagingRoles(!managingRoles)}
              className="text-sm flex items-center gap-1.5 text-muted hover:text-text"
            >
              {managingRoles ? "Done" : "Manage roles"}
            </button>
          ) : undefined
        }
      />

      {managingRoles && (
        <div className="bg-panel border border-border p-5 mb-6">
          <div className="space-y-2 mb-3">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm bg-panel-2 border border-border px-3 py-2">
                {r.name}
                <button onClick={() => removeRole(r.id)} className="text-muted-2 hover:text-tally">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRole()}
              placeholder="New role, e.g. Lighting"
              className="flex-1 bg-bg border border-border px-3 py-2 text-sm outline-none focus:border-tally"
            />
            <button onClick={addRole} className="text-sm px-3 py-2 bg-panel-2 border border-border flex items-center gap-1.5">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-panel-2">
              <th className="text-left px-4 py-3 border-b border-border" style={{ fontFamily: "var(--font-mono)" }}>
                Sunday
              </th>
              {roles.map((r) => (
                <th key={r.id} className="text-left px-4 py-3 border-b border-border font-normal text-muted" style={{ fontFamily: "var(--font-mono)" }}>
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sundays.map((date) => {
              const sundayIso = isoDate(date);
              return (
                <tr key={sundayIso} className="border-b last:border-b-0 border-border">
                  <td className="px-4 py-3 whitespace-nowrap bg-panel" style={{ fontFamily: "var(--font-head)" }}>
                    {shortLabel(date)}
                  </td>
                  {roles.map((r) => {
                    const assigned = assignmentFor(sundayIso, r.id);
                    const isMe = assigned === me;
                    return (
                      <td key={r.id} className="px-4 py-3 bg-panel">
                        {isAdmin ? (
                          <select
                            value={assigned}
                            onChange={(e) => assign(sundayIso, r.id, e.target.value)}
                            className="bg-bg border border-border px-2 py-1.5 text-sm outline-none focus:border-tally w-full"
                          >
                            <option value="">Unassigned</option>
                            {roster.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        ) : assigned ? (
                          <span
                            className="px-2 py-1"
                            style={{
                              color: isMe ? "var(--tally)" : "var(--text)",
                              fontWeight: isMe ? 600 : 400,
                            }}
                          >
                            {assigned}
                          </span>
                        ) : (
                          <span className="text-muted-2">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {roles.length === 0 && (
        <p className="text-sm text-muted-2 mt-4">
          {isAdmin ? "Add a role above to start building the schedule." : "No roles set up yet."}
        </p>
      )}
    </div>
  );
}
