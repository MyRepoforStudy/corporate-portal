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
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <Link href="/profile" className="text-xs text-brand-700 hover:underline dark:text-brand-300">
          {profileLink} →
        </Link>
      </div>
      {/* The person fills the rest of the card (it is as tall as the banner next to it): a big photo and
          larger text; long names, positions and departments wrap instead of being cut off. */}
      <div className="flex flex-1 items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-24 w-24 shrink-0 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-3xl font-medium text-gray-500">
            {fullName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="break-words text-lg font-semibold leading-snug text-gray-900">{fullName}</p>
          {positionTitle && <p className="mt-1 text-sm text-gray-700">{positionTitle}</p>}
          {departmentName && <p className="mt-0.5 text-sm text-gray-500">{departmentName}</p>}
        </div>
      </div>
    </div>
  );
}
