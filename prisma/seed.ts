import { PrismaClient, type Department } from "@prisma/client";

const prisma = new PrismaClient();

// Department has no unique constraint besides id, so upsert isn't available -
// find-or-create by (name, parentId) keeps repeated seed runs idempotent.
async function upsertDepartment(name: string, parentId: string | null = null): Promise<Department> {
  const existing = await prisma.department.findFirst({ where: { name, parentId } });
  if (existing) return existing;
  return prisma.department.create({ data: { name, parentId } });
}

// Same story for Room - no unique constraint on name.
async function upsertRoom(data: {
  name: string;
  capacity: number;
  floor: number;
  equipment: string[];
}) {
  const existing = await prisma.room.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.room.create({ data });
}

async function main() {
  // ---- Bootstrap admin user -------------------------------------------------
  // ldapUid must match the sAMAccountName of the real person who should get
  // admin access first. Override via ADMIN_LDAP_UID when seeding a real
  // environment; falls back to "admin" for local/dev-mode testing.
  const adminLdapUid = process.env.ADMIN_LDAP_UID ?? "admin";
  const admin = await prisma.user.upsert({
    where: { ldapUid: adminLdapUid },
    update: {},
    create: {
      ldapUid: adminLdapUid,
      email: `${adminLdapUid}@bank.local`,
      displayName: "Администратор портала",
      role: "ADMIN",
    },
  });

  // ---- Departments (hierarchy: департамент -> отдел) -------------------------
  const itDept = await upsertDepartment("Департамент информационных технологий");
  const devUnit = await upsertDepartment("Отдел разработки", itDept.id);
  const infraUnit = await upsertDepartment("Отдел инфраструктуры", itDept.id);

  const retailDept = await upsertDepartment("Департамент розничного бизнеса");
  const salesUnit = await upsertDepartment("Отдел продаж", retailDept.id);
  const clientServiceUnit = await upsertDepartment("Отдел обслуживания клиентов", retailDept.id);

  const hrDept = await upsertDepartment("Департамент по работе с персоналом");

  // ---- Positions ---------------------------------------------------------
  const [director, headOfUnit, leadSpecialist, specialist, sysAdmin, developer] =
    await Promise.all(
      [
        "Директор департамента",
        "Руководитель отдела",
        "Ведущий специалист",
        "Специалист",
        "Системный администратор",
        "Разработчик",
      ].map((title) =>
        prisma.position.upsert({ where: { title }, update: {}, create: { title } })
      )
    );

  // ---- Employees -----------------------------------------------------------
  const employees = [
    {
      fullName: "Иванов Иван Иванович",
      email: "i.ivanov@bank.local",
      phone: "+7 (700) 100-10-01",
      departmentId: itDept.id,
      positionId: director.id,
    },
    {
      fullName: "Петрова Анна Сергеевна",
      email: "a.petrova@bank.local",
      phone: "+7 (700) 100-10-02",
      departmentId: devUnit.id,
      positionId: headOfUnit.id,
    },
    {
      fullName: "Сидоров Алексей Викторович",
      email: "a.sidorov@bank.local",
      phone: "+7 (700) 100-10-03",
      departmentId: devUnit.id,
      positionId: developer.id,
    },
    {
      fullName: "Кузнецова Мария Дмитриевна",
      email: "m.kuznetsova@bank.local",
      phone: "+7 (700) 100-10-04",
      departmentId: devUnit.id,
      positionId: developer.id,
    },
    {
      fullName: "Николаев Дмитрий Олегович",
      email: "d.nikolaev@bank.local",
      phone: "+7 (700) 100-10-05",
      departmentId: infraUnit.id,
      positionId: sysAdmin.id,
    },
    {
      fullName: "Смирнова Елена Павловна",
      email: "e.smirnova@bank.local",
      phone: "+7 (700) 100-10-06",
      departmentId: retailDept.id,
      positionId: director.id,
    },
    {
      fullName: "Волков Артём Игоревич",
      email: "a.volkov@bank.local",
      phone: "+7 (700) 100-10-07",
      departmentId: salesUnit.id,
      positionId: headOfUnit.id,
    },
    {
      fullName: "Морозова Ольга Андреевна",
      email: "o.morozova@bank.local",
      phone: "+7 (700) 100-10-08",
      departmentId: salesUnit.id,
      positionId: leadSpecialist.id,
    },
    {
      fullName: "Лебедев Сергей Николаевич",
      email: "s.lebedev@bank.local",
      phone: "+7 (700) 100-10-09",
      departmentId: clientServiceUnit.id,
      positionId: specialist.id,
    },
    {
      fullName: "Козлова Виктория Романовна",
      email: "v.kozlova@bank.local",
      phone: "+7 (700) 100-10-10",
      departmentId: hrDept.id,
      positionId: headOfUnit.id,
    },
  ];

  const employeesByEmail = new Map<string, { id: string }>();
  for (const employee of employees) {
    const record = await prisma.employee.upsert({
      where: { email: employee.email },
      update: {},
      create: employee,
    });
    employeesByEmail.set(employee.email, record);
  }

  // ---- Workplaces ------------------------------------------------------------
  const workplaces: Record<string, { building?: string; floor: number; room: string; deskNumber: string }> = {
    "i.ivanov@bank.local": { building: "Главный корпус", floor: 5, room: "Каб. 512", deskNumber: "512-01" },
    "a.petrova@bank.local": { building: "Главный корпус", floor: 4, room: "Опен-спейс «Восток»", deskNumber: "4-14" },
    "a.sidorov@bank.local": { building: "Главный корпус", floor: 4, room: "Опен-спейс «Восток»", deskNumber: "4-15" },
    "m.kuznetsova@bank.local": { building: "Главный корпус", floor: 4, room: "Опен-спейс «Восток»", deskNumber: "4-16" },
    "d.nikolaev@bank.local": { building: "Главный корпус", floor: 2, room: "Серверная зона", deskNumber: "2-03" },
    "e.smirnova@bank.local": { building: "Корпус Б", floor: 3, room: "Каб. 305", deskNumber: "305-01" },
  };

  for (const [email, data] of Object.entries(workplaces)) {
    const employee = employeesByEmail.get(email);
    if (!employee) continue;
    await prisma.workplace.upsert({
      where: { employeeId: employee.id },
      update: data,
      create: { employeeId: employee.id, ...data },
    });
  }

  // ---- Rooms -----------------------------------------------------------------
  await Promise.all([
    upsertRoom({
      name: "Переговорная «Альфа»",
      capacity: 6,
      floor: 3,
      equipment: ["Проектор", "Видеоконференция", "Флипчарт"],
    }),
    upsertRoom({
      name: "Переговорная «Бета»",
      capacity: 10,
      floor: 3,
      equipment: ["Телевизор", "Видеоконференция"],
    }),
    upsertRoom({
      name: "Переговорная «Гамма»",
      capacity: 4,
      floor: 5,
      equipment: ["Флипчарт"],
    }),
    upsertRoom({
      name: "Большой зал заседаний",
      capacity: 20,
      floor: 1,
      equipment: ["Проектор", "Видеоконференция", "Микрофоны", "Флипчарт"],
    }),
  ]);

  // ---- News --------------------------------------------------------------
  // No natural unique key on News - only seed the starter posts once.
  if ((await prisma.news.count()) === 0) {
    await prisma.news.createMany({
      data: [
        {
          title: "Запуск корпоративного портала",
          content:
            "Уважаемые коллеги! Запущена внутренняя версия корпоративного портала: оргструктура, бронирование переговорных и новости банка в одном месте.",
          authorId: admin.id,
        },
        {
          title: "Регламент бронирования переговорных комнат",
          content:
            "Напоминаем: бронь автоматически отклоняется при пересечении по времени с уже существующей. Отменить свою бронь можно в разделе «Бронирование».",
          authorId: admin.id,
        },
      ],
    });
  }

  console.log("Seed completed.");
  console.log(`Bootstrap admin ldapUid: "${adminLdapUid}" (role=ADMIN).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
