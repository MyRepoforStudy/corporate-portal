import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new ApiError(401, "Unauthorized");
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden");
  }
  return session;
}

export async function requireHrOrAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && session.user.role !== "HR") {
    throw new ApiError(403, "Forbidden");
  }
  return session;
}

// canBookRooms is read fresh from the DB rather than trusted off the JWT,
// since the JWT is only refreshed on next login - an Admin revoking booking
// access should take effect immediately, not after the user's session expires.
export async function requireBookingPermission(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role === "ADMIN") {
    return session;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { canBookRooms: true },
  });
  if (!user?.canBookRooms) {
    throw new ApiError(403, "Бронирование переговорных недоступно. Обратитесь к администратору.");
  }
  return session;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Ошибка валидации", details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Запись с такими данными уже существует" },
        { status: 409 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Запись используется в других данных, удаление невозможно" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }
  }

  console.error(error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
