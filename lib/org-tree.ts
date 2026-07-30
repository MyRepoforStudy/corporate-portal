import type { Department, Employee, Position, Vacancy } from "@prisma/client";

export type EmployeeWithPosition = Employee & { position: Position };
export type VacancyWithPosition = Vacancy & { position: Position };

export interface DepartmentNode {
  id: string;
  name: string;
  order: number;
  isPublished: boolean;
  headEmployeeId: string | null;
  employees: EmployeeWithPosition[];
  vacancies: VacancyWithPosition[];
  children: DepartmentNode[];
}

function byOrderThenName(a: DepartmentNode, b: DepartmentNode): number {
  return a.order - b.order || a.name.localeCompare(b.name);
}

export function buildDepartmentTree(
  departments: Department[],
  employees: EmployeeWithPosition[],
  vacancies: VacancyWithPosition[] = []
): DepartmentNode[] {
  const nodeById = new Map<string, DepartmentNode>();

  for (const dept of departments) {
    nodeById.set(dept.id, {
      id: dept.id,
      name: dept.name,
      order: dept.order,
      isPublished: dept.isPublished,
      headEmployeeId: dept.headEmployeeId,
      employees: [],
      vacancies: [],
      children: [],
    });
  }

  for (const employee of employees) {
    nodeById.get(employee.departmentId)?.employees.push(employee);
  }

  for (const vacancy of vacancies) {
    nodeById.get(vacancy.departmentId)?.vacancies.push(vacancy);
  }

  const roots: DepartmentNode[] = [];
  for (const dept of departments) {
    const node = nodeById.get(dept.id)!;
    if (dept.parentId && nodeById.has(dept.parentId)) {
      nodeById.get(dept.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodeById.values()) {
    node.children.sort(byOrderThenName);
  }
  roots.sort(byOrderThenName);

  return roots;
}

/**
 * The department's assigned head, or - if none was explicitly set (or the
 * assigned employee no longer belongs to this department) - the
 * highest-ranked employee in the department (employees are pre-sorted by
 * Position.rank desc, name asc by the caller's query).
 */
export function resolveHead(node: DepartmentNode): EmployeeWithPosition | null {
  if (node.headEmployeeId) {
    const explicit = node.employees.find((e) => e.id === node.headEmployeeId);
    if (explicit) return explicit;
  }
  return node.employees[0] ?? null;
}

export function findDepartmentNode(nodes: DepartmentNode[], id: string): DepartmentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findDepartmentNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/** All employees in this department and every department nested under it. */
export function collectEmployees(node: DepartmentNode): EmployeeWithPosition[] {
  return [...node.employees, ...node.children.flatMap(collectEmployees)];
}

export function countEmployees(node: DepartmentNode): number {
  return node.employees.length + node.children.reduce((sum, c) => sum + countEmployees(c), 0);
}

/** All vacancies in this department and every department nested under it. */
export function collectVacancies(node: DepartmentNode): VacancyWithPosition[] {
  return [...node.vacancies, ...node.children.flatMap(collectVacancies)];
}

export function countVacancies(node: DepartmentNode): number {
  return node.vacancies.length + node.children.reduce((sum, c) => sum + countVacancies(c), 0);
}

/** Nested-tree equivalent of getDepartmentPath - walks DepartmentNode[] (not the flat Department[] list) since the org chart only has the built tree available. */
export function findNodePath(
  nodes: DepartmentNode[],
  id: string,
  path: DepartmentNode[] = []
): DepartmentNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (node.id === id) return nextPath;
    const found = findNodePath(node.children, id, nextPath);
    if (found) return found;
  }
  return null;
}

/** Path from the root department down to `departmentId`, inclusive. */
export function getDepartmentPath(departments: Department[], departmentId: string): Department[] {
  const byId = new Map(departments.map((d) => [d.id, d]));
  const path: Department[] = [];

  let current = byId.get(departmentId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}
