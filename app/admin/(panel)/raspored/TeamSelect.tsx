"use client";

import { useState } from "react";

export type TeamOption = { groupId: number; teamId: number; label: string };

// Select ekipe koji puni skrivene group_id i team_id (akcije ih čitaju odvojeno).
export function TeamSelect({ teams, className = "" }: { teams: TeamOption[]; className?: string }) {
  const [val, setVal] = useState("");
  const [gid, tid] = val ? val.split(":") : ["", ""];
  return (
    <>
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className={className}
        aria-label="Ekipa"
      >
        <option value="">— ekipa —</option>
        {teams.map((t) => (
          <option key={`${t.groupId}:${t.teamId}`} value={`${t.groupId}:${t.teamId}`}>
            {t.label}
          </option>
        ))}
      </select>
      <input type="hidden" name="group_id" value={gid} />
      <input type="hidden" name="team_id" value={tid} />
    </>
  );
}
