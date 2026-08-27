import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const locale = getLocale();
  const dict = getDictionary(locale);

  const documents = await prisma.document.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.documents.title}</h1>
        <p className="text-sm text-gray-500">{dict.documents.subtitle}</p>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} text={dict.documents.empty} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {documents.map((document) => (
            <a
              key={document.id}
              href={document.fileUrl}
              download={document.fileName}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{document.title}</p>
                {document.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{document.description}</p>
                )}
                <p className="mt-1 truncate text-xs text-gray-400">{document.fileName}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
