import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

const PAGE_SIZE = 20;

const SORTABLE_FIELDS = [
  "fullName",
  "department",
  "building",
  "floor",
  "room",
  "deskNumber",
] as const;

type SortableField = (typeof SORTABLE_FIELDS)[number];

function isSortableField(value: string | null): value is SortableField {
  return !!value && (SORTABLE_FIELDS as readonly string[]).includes(value);
}

function buildOrderBy(
  sortParam: string | null,
  dirParam: string | null
): Prisma.EmployeeOrderByWithRelationInput[] {
  const dir: Prisma.SortOrder = dirParam === "desc" ? "desc" : "asc";
  if (!isSortableField(sortParam)) {
    return [{ fullName: "asc" }];
  }

  switch (sortParam) {
    case "fullName":
      return [{ fullName: dir }];
    case "department":
      return [{ department: { name: dir } }, { fullName: "asc" }];
    case "building":
      return [{ workplace: { building: dir } }, { fullName: "asc" }];
    case "floor":
      return [{ workplace: { floor: dir } }, { fullName: "asc" }];
    case "room":
      return [{ workplace: { room: dir } }, { fullName: "asc" }];
    case "deskNumber":
      return [{ workplace: { deskNumber: dir } }, { fullName: "asc" }];
    default:
      return [{ fullName: "asc" }];
  }
}

// This is a Employee-first (not Workplace-first) listing on purpose: HR needs
// to see every employee, including those with no seat assigned yet, not just
// the ones that already have a Workplace row.
export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("search")?.trim();
    const floorParam = searchParams.get("floor");
    const floor =
      floorParam && !Number.isNaN(Number(floorParam)) ? Number(floorParam) : undefined;
    const building = searchParams.get("building")?.trim() || undefined;
    const departmentId = searchParams.get("department")?.trim() || undefined;
    const pageParam = Number(searchParams.get("page"));
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    const orderBy = buildOrderBy(searchParams.get("sort"), searchParams.get("dir"));

    const hasWorkplaceFilter = floor !== undefined || building !== undefined;

    const where: Prisma.EmployeeWhereInput = {
      departmentId,
      ...(hasWorkplaceFilter
        ? {
            workplace: {
              is: {
                ...(floor !== undefined ? { floor } : {}),
                ...(building ? { building: { contains: building, mode: "insensitive" } } : {}),
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { department: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total, floorRows, buildingRows] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { department: true, position: true, workplace: true },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.employee.count({ where }),
      prisma.workplace.findMany({
        distinct: ["floor"],
        select: { floor: true },
        orderBy: { floor: "asc" },
      }),
      prisma.workplace.findMany({
        distinct: ["building"],
        where: { building: { not: null } },
        select: { building: true },
        orderBy: { building: "asc" },
      }),
    ]);

    const floors = floorRows.map((w) => w.floor);
    const buildings = buildingRows
      .map((w) => w.building)
      .filter((value): value is string => value !== null);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      floors,
      buildings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
