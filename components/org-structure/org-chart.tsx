"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import {
  countEmployees,
  countVacancies,
  findNodePath,
  type DepartmentNode,
} from "@/lib/org-tree";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { VacancyCard } from "@/components/org-structure/vacancy-card";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatEmployeesCount } from "@/lib/i18n/format";

const ROOT_ID = "__root__";

function ChartBox({
  node,
  isRoot,
  isCurrent,
  onClick,
  delay,
}: {
  node: DepartmentNode;
  isRoot?: boolean;
  isCurrent?: boolean;
  onClick: () => void;
  delay: number;
}) {
  const employeeTotal = countEmployees(node);
  const vacancyTotal = countVacancies(node);
  const hasChildren = node.children.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`chart-node-enter group relative flex min-w-[160px] max-w-[220px] flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm ${
        isRoot
          ? "border-brand-700 bg-brand-600 text-white hover:bg-brand-700"
          : isCurrent
            ? "border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30"
            : "border-gray-200 bg-white hover:border-brand-300"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={`truncate text-sm font-medium ${
          isRoot ? "text-white" : isCurrent ? "text-brand-800 dark:text-brand-200" : "text-gray-900"
        }`}
      >
        {node.name}
      </span>
      {!isRoot && (
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
      )}
      {hasChildren && (
        <ChevronDown
          className={`absolute -bottom-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border bg-white p-0.5 ${
            isRoot ? "border-brand-700 text-brand-600" : "border-gray-200 text-gray-400"
          }`}
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export function OrgChart({
  tree,
  locale,
  dict,
}: {
  tree: DepartmentNode[];
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  const [currentId, setCurrentId] = useState<string | null>(null);

  const root: DepartmentNode = { id: ROOT_ID, name: "BNK", employees: [], vacancies: [], children: tree };
  const path = currentId ? (findNodePath([root], currentId) ?? [root]) : [root];
  const currentNode = path[path.length - 1];

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
                onClick={() => setCurrentId(node.id === ROOT_ID ? null : node.id)}
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
          <ChartBox
            node={currentNode}
            isRoot={currentNode.id === ROOT_ID}
            isCurrent
            onClick={() => {}}
            delay={0}
          />

          {currentNode.children.length > 0 && (
            <>
              <div className="chart-line-enter h-6 w-px bg-gray-300" />
              <div className="flex w-fit gap-6 border-t border-gray-300 pt-6">
                {currentNode.children.map((child, i) => (
                  <div key={child.id} className="relative">
                    <div className="chart-line-enter absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-gray-300" />
                    <ChartBox
                      node={child}
                      onClick={() => setCurrentId(child.id)}
                      delay={i * 40}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {currentNode.id !== ROOT_ID && (
        <div>
          <h3 className="mb-3 font-medium text-gray-900">
            {currentNode.name}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {formatEmployeesCount(currentNode.employees.length, locale)}
            </span>
          </h3>
          {currentNode.employees.length === 0 && currentNode.vacancies.length === 0 ? (
            <p className="text-sm text-gray-500">{dict.noEmployeesInDept}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentNode.employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} locale={locale} dict={dict.employeeModal} />
              ))}
              {currentNode.vacancies.map((vacancy) => (
                <VacancyCard key={vacancy.id} vacancy={vacancy} label={dict.vacancyLabel} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
