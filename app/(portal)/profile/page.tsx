import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: {
      employee: {
        include: { department: true, position: true, workplace: true },
      },
    },
  });

  const { employee, ...account } = user;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Личный кабинет</h1>
      <ProfileForm
        account={{
          displayName: account.displayName,
          email: account.email,
          ldapUid: account.ldapUid,
          role: account.role,
          canBookRooms: account.canBookRooms,
        }}
        employee={
          employee
            ? {
                fullName: employee.fullName,
                email: employee.email,
                phone: employee.phone,
                photoUrl: employee.photoUrl,
                bio: employee.bio,
                activityArea: employee.activityArea,
                department: employee.department.name,
                position: employee.position.title,
                workplace: employee.workplace
                  ? {
                      building: employee.workplace.building,
                      floor: employee.workplace.floor,
                      room: employee.workplace.room,
                      deskNumber: employee.workplace.deskNumber,
                    }
                  : null,
                vacationDaysTotal: employee.vacationDaysTotal,
                vacationDaysUsed: employee.vacationDaysUsed,
              }
            : null
        }
      />
    </div>
  );
}
