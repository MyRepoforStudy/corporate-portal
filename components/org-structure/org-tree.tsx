"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { countEmployees, type DepartmentNode } from "@/lib/org-tree";
import type { Dictionary } from "@/lib/i18n";

function DepartmentTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  labels,
}: {
  node: DepartmentNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  labels: Pick<Dictionary["orgStructure"], "collapse" | "expand">;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm ${
          isSelected
            ? "bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label={expanded ? labels.collapse : labels.expand}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <button onClick={() => onSelect(node.id)} className="flex-1 truncate text-left">
          {node.name}
        </button>
        <span className="shrink-0 text-xs text-gray-500">{countEmployees(node)}</span>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <DepartmentTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              labels={labels}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTree({
  tree,
  selectedId,
  onSelect,
  emptyText,
  labels,
}: {
  tree: DepartmentNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyText: string;
  labels: Pick<Dictionary["orgStructure"], "collapse" | "expand">;
}) {
  if (tree.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <DepartmentTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          labels={labels}
        />
      ))}
    </div>
  );
}
