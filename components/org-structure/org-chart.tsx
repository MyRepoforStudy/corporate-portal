"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import {
  countEmployees,
  countVacancies,
  findNodePath,
  resolveHead,
  type DepartmentNode,
} from "@/lib/org-tree";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { VacancyCard } from "@/components/org-structure/vacancy-card";
import type { Dictionary, Locale } from "@/lib/i18n";

const ROOT_ID = "__root__";

function publishedChildren(node: DepartmentNode): DepartmentNode[] {
  return node.children.filter((child) => child.isPublished);
}

function CountBadge({ node }: { node: DepartmentNode }) {
  const employeeTotal = countEmployees(node);
  const vacancyTotal = countVacancies(node);
  return (
    <span className="flex items-center gap-2 text-xs text-gray-500">
      <span className="flex items-center gap-1">
        <Users className="h-3 w-3" aria-hidden="true" />
        {employeeTotal}
      </span>
      {vacancyTotal > 0 && (
        <span className="flex items-center gap-1 text-brand-700 dark:text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />
          {vacancyTotal}
        </span>
      )}
    </span>
  );
}

function HeadAvatar({ node, size }: { node: DepartmentNode; size: number }) {
  const head = resolveHead(node);
  const className = `shrink-0 rounded-full border border-gray-200 object-cover`;
  if (head?.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={head.photoUrl} alt="" className={className} style={{ width: size, height: size }} />
    );
  }
  const initial = (head?.fullName ?? node.name).charAt(0);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 font-medium text-gray-500"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

function RootBox({ node, delay }: { node: DepartmentNode; delay: number }) {
  const hasChildren = publishedChildren(node).length > 0;
  return (
    <div
      className="chart-node-enter relative flex min-w-[160px] flex-col items-center gap-1 rounded-xl border border-brand-700 bg-brand-600 px-5 py-3 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="truncate text-sm font-medium text-white">{node.name}</span>
      {hasChildren && (
        <ChevronDown
          className="absolute -bottom-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-brand-700 bg-white p-0.5 text-brand-600"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/** The current node's own card: a wide horizontal bar (name, head, count in
 * one row) rather than the compact vertical cards used for its children -
 * it's alone at the top and can use the full width productively. */
function CurrentDeptBar({ node, dict }: { node: DepartmentNode; dict: Dictionary["orgStructure"] }) {
  const head = resolveHead(node);
  return (
    <div className="chart-node-enter flex w-full items-center gap-4 rounded-lg border border-gray-200 border-l-4 border-l-brand-600 bg-white px-5 py-4 text-left">
      <HeadAvatar node={node} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{node.name}</p>
        {head && (
          <p className="truncate text-sm text-gray-500">
            {dict.headLabel}: {head.fullName}
          </p>
        )}
      </div>
      <CountBadge node={node} />
    </div>
  );
}

function DeptCard({
  node,
  onClick,
  delay,
}: {
  node: DepartmentNode;
  onClick: () => void;
  delay: number;
}) {
  const head = resolveHead(node);

  return (
    <button
      type="button"
      onClick={onClick}
      className="chart-node-enter group flex flex-col items-center gap-2 rounded-lg border border-gray-200 border-t-[3px] border-t-brand-600 bg-white px-3 py-2.5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <HeadAvatar node={node} size={32} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-900" style={{ maxWidth: 130 }}>
          {node.name}
        </p>
        {head && (
          <p className="truncate text-[11px] text-gray-500" style={{ maxWidth: 130 }}>
            {head.fullName}
          </p>
        )}
      </div>
      <CountBadge node={node} />
    </button>
  );
}

function TeamPill({ node, onClick }: { node: DepartmentNode; onClick: () => void }) {
  const employeeTotal = countEmployees(node);
  return (
    <button
      type="button"
      onClick={onClick}
      title={node.name}
      className="flex w-full items-center justify-between gap-1.5 truncate rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:bg-gray-800 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
    >
      <span className="truncate">{node.name}</span>
      {employeeTotal > 0 && <span className="shrink-0 text-gray-400">{employeeTotal}</span>}
    </button>
  );
}

export function OrgChart({
  tree,
  currentId,
  locale,
  dict,
}: {
  tree: DepartmentNode[];
  currentId: string | null;
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  const router = useRouter();

  function goTo(id: string | null) {
    router.push(id ? `/org-structure/chart/${id}` : "/org-structure/chart");
  }

  const root: DepartmentNode = {
    id: ROOT_ID,
    name: "BNK",
    order: 0,
    isPublished: true,
    headEmployeeId: null,
    employees: [],
    vacancies: [],
    children: tree,
  };
  const path = currentId ? (findNodePath([root], currentId) ?? [root]) : [root];
  const currentNode = path[path.length - 1];
  const isRoot = currentNode.id === ROOT_ID;
  const children = publishedChildren(currentNode);

  const head = isRoot ? null : resolveHead(currentNode);
  const staff = currentNode.employees.filter((e) => e.id !== head?.id);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {path.map((node, i) => (
          <span key={node.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" />}
            {i === path.length - 1 ? (
              <span className="font-medium text-gray-900">{node.name}</span>
            ) : (
              <button
                type="button"
                onClick={() => goTo(node.id === ROOT_ID ? null : node.id)}
                className="text-gray-500 hover:text-brand-700 hover:underline dark:hover:text-brand-300"
              >
                {node.name}
              </button>
            )}
          </span>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-8">
        <div key={currentNode.id} className="flex min-w-fit flex-col items-center">
          <div className="w-full max-w-2xl">
            {isRoot ? <RootBox node={currentNode} delay={0} /> : <CurrentDeptBar node={currentNode} dict={dict} />}
          </div>

          {head && (
            <div className="mt-4 w-full max-w-2xl">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">{dict.headLabel}</p>
              <EmployeeCard employee={head} locale={locale} dict={dict.employeeModal} />
            </div>
          )}

          {(staff.length > 0 || currentNode.vacancies.length > 0) && (
            <div className="mt-6 w-full max-w-2xl space-y-4 border-t border-gray-200 pt-6">
              {staff.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {staff.map((employee) => (
                    <EmployeeCard key={employee.id} employee={employee} locale={locale} dict={dict.employeeModal} />
                  ))}
                </div>
              )}
              {currentNode.vacancies.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {dict.vacanciesTitle}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {currentNode.vacancies.map((vacancy) => (
                      <VacancyCard key={vacancy.id} vacancy={vacancy} label={dict.vacancyLabel} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {children.length > 0 && (
            <>
              <div className="chart-line-enter h-6 w-px bg-gray-300" />
              <div className="flex w-full flex-wrap justify-center gap-x-8 gap-y-6 border-t border-gray-300 pt-6">
                {children.map((child, i) => {
                  const grandchildren = publishedChildren(child);
                  return (
                    <div key={child.id} className="relative flex flex-col items-center gap-2.5">
                      <div className="chart-line-enter absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-gray-300" />
                      <div className="w-[170px]">
                        <DeptCard node={child} onClick={() => goTo(child.id)} delay={i * 40} />
                      </div>
                      {grandchildren.length > 0 && (
                        <div className="grid w-[360px] grid-cols-2 gap-1.5">
                          {grandchildren.map((grandchild) => (
                            <TeamPill key={grandchild.id} node={grandchild} onClick={() => goTo(grandchild.id)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
