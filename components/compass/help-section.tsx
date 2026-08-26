import { Mail } from "lucide-react";
import type { Employee, Position } from "@prisma/client";

export interface HelpContact {
  label: string;
  employee: (Employee & { position: Position }) | null;
  fallbackText: string;
}

function HelpCard({ contact, contactLabel }: { contact: HelpContact; contactLabel: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{contact.label}</p>
      {contact.employee ? (
        <>
          <p className="mt-1 font-medium text-gray-900">{contact.employee.fullName}</p>
          <p className="text-sm text-gray-500">{contact.employee.position.title}</p>
          <a
            href={`mailto:${contact.employee.email}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline dark:text-brand-300"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {contactLabel}
          </a>
        </>
      ) : (
        <p className="mt-1 text-sm text-gray-500">{contact.fallbackText}</p>
      )}
    </div>
  );
}

export function HelpSection({
  contacts,
  title,
  subtitle,
  contactLabel,
}: {
  contacts: HelpContact[];
  title: string;
  subtitle: string;
  contactLabel: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="font-medium text-gray-900">{title}</h2>
      <p className="mb-3 text-sm text-gray-500">{subtitle}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {contacts.map((contact) => (
          <HelpCard key={contact.label} contact={contact} contactLabel={contactLabel} />
        ))}
      </div>
    </div>
  );
}
