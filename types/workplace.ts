import type { Department, Employee, Position, Workplace as PrismaWorkplace } from "@prisma/client";

export type Workplace = PrismaWorkplace;

export type EmployeeWithDepartmentAndPosition = Employee & {
  department: Department;
  position: Position;
};

export type WorkplaceWithEmployee = Workplace & {
  employee: EmployeeWithDepartmentAndPosition;
};

// The table lists every employee (including those with no seat assigned yet),
// so it's employee-first with an optional workplace - the reverse shape of
// WorkplaceWithEmployee above, which assumes a workplace always exists.
export type EmployeeWithWorkplace = EmployeeWithDepartmentAndPosition & {
  workplace: Workplace | null;
};
