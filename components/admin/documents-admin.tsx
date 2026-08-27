"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileText, X } from "lucide-react";
import type { Document } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = { title: "", description: "", fileUrl: "", fileName: "", order: "0" };

export function DocumentsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<Document>("/api/documents");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const body = new FormData();
    body.append("document", file);

    const res = await fetch("/api/documents/upload", { method: "POST", body });
    setIsUploading(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось загрузить файл");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { url, name } = await res.json();
    setForm((f) => ({ ...f, fileUrl: url, fileName: name }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = {
      title: form.title,
      description: form.description,
      fileUrl: form.fileUrl,
      fileName: form.fileName,
      order: Number(form.order),
    };
    const result = editingId ? await update(editingId, payload) : await create(payload);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startEdit(document: Document) {
    setEditingId(document.id);
    setForm({
      title: document.title,
      description: document.description ?? "",
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      order: String(document.order),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить документ?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Документы</h1>
        <p className="text-sm text-gray-500">
          Регламенты, политики и формы — отображаются в разделе «Документы» у всех сотрудников.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Краткое описание (необязательно)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Файл</label>
          <div className="flex items-center gap-3">
            {form.fileName && (
              <span className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="max-w-[220px] truncate">{form.fileName}</span>
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileChange}
              className="text-sm"
            />
            {isUploading && <span className="text-xs text-gray-500">Загрузка...</span>}
            {form.fileUrl && !isUploading && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, fileUrl: "", fileName: "" }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Убрать
              </button>
            )}
          </div>
        </div>

        <input
          type="number"
          min={0}
          placeholder="Порядок сортировки"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm sm:w-48"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {editingId ? "Сохранить" : "Добавить документ"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{document.title}</p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {document.fileName}
                  {document.description && ` · ${document.description}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => startEdit(document)} className="text-sm text-brand-700 hover:underline dark:text-brand-300">
                  Изменить
                </button>
                <button onClick={() => handleDelete(document.id)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
