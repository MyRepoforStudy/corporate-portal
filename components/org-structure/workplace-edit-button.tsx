"use client";

import { useState } from "react";
import { WorkplaceEditModal } from "@/components/org-structure/workplace-edit-modal";
import type { Workplace } from "@/types/workplace";
import type { Dictionary } from "@/lib/i18n";

export function WorkplaceEditButton({
  employeeId,
  employeeFullName,
  workplace,
  editLabel,
  dict,
  onSaved,
}: {
  employeeId: string;
  employeeFullName: string;
  workplace: Workplace | null;
  editLabel: string;
  dict: Dictionary["workplaces"]["modal"];
  onSaved: (workplace: Workplace) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="shrink-0 text-sm text-brand-700 hover:underline dark:text-brand-300"
      >
        {editLabel}
      </button>
      {isOpen && (
        <WorkplaceEditModal
          employeeId={employeeId}
          employeeFullName={employeeFullName}
          workplace={workplace}
          dict={dict}
          onClose={() => setIsOpen(false)}
          onSaved={(updated) => {
            onSaved(updated);
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}
