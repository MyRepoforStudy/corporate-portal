import Link from "next/link";

export function MyBnkCard({
  fullName,
  positionTitle,
  departmentName,
  photoUrl,
  title,
  profileLink,
}: {
  fullName: string;
  positionTitle: string | null;
  departmentName: string | null;
  photoUrl: string | null;
  title: string;
  profileLink: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <Link href="/profile" className="text-xs text-brand-700 hover:underline dark:text-brand-300">
          {profileLink} →
        </Link>
      </div>
      <div className="flex items-center gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-medium text-gray-500">
            {fullName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{fullName}</p>
          {positionTitle && <p className="truncate text-xs text-gray-500">{positionTitle}</p>}
          {departmentName && <p className="truncate text-xs text-gray-400">{departmentName}</p>}
        </div>
      </div>
    </div>
  );
}
