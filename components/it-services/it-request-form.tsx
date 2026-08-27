"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export function ItRequestForm({
  title,
  subjectPlaceholder,
  descriptionPlaceholder,
  submitLabel,
  submittingLabel,
  successMessage,
  errorMessage,
}: {
  title: string;
  subjectPlaceholder: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
  errorMessage: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const res = await fetch("/api/it-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description }),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      showToast(errorMessage, "error");
      return;
    }

    setSubject("");
    setDescription("");
    showToast(successMessage, "success");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="font-medium text-gray-900">{title}</h2>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={subjectPlaceholder}
        className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={descriptionPlaceholder}
        rows={3}
        className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        required
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
