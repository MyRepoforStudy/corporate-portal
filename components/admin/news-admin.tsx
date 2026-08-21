"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileText, Pin, X } from "lucide-react";
import type { News } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = {
  title: "",
  content: "",
  imageUrl: "",
  documentUrl: "",
  documentName: "",
  isPublished: true,
  isPinned: false,
};

export function NewsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<News>("/api/news");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const body = new FormData();
    body.append("image", file);

    const res = await fetch("/api/news/upload", { method: "POST", body });
    setIsUploading(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось загрузить изображение");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { url } = await res.json();
    setForm((f) => ({ ...f, imageUrl: url }));
  }

  async function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploadingDocument(true);

    const body = new FormData();
    body.append("document", file);

    const res = await fetch("/api/news/upload-document", { method: "POST", body });
    setIsUploadingDocument(false);

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      setError(responseBody?.error ?? "Не удалось загрузить документ");
      if (documentInputRef.current) documentInputRef.current.value = "";
      return;
    }

    const { url, name } = await res.json();
    setForm((f) => ({ ...f, documentUrl: url, documentName: name }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = editingId ? await update(editingId, form) : await create(form);
    if (result) {
      setError(result);
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  }

  function startEdit(item: News) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl ?? "",
      documentUrl: item.documentUrl ?? "",
      documentName: item.documentName ?? "",
      isPublished: item.isPublished,
      isPinned: item.isPinned,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить новость?")) return;
    const result = await remove(id);
    if (result) setError(result);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Новости</h1>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Заголовок"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <textarea
          placeholder="Текст новости"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Изображение</label>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt=""
                className="h-16 w-24 rounded-md border border-gray-200 object-cover"
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="text-sm"
            />
            {isUploading && <span className="text-xs text-gray-500">Загрузка...</span>}
            {form.imageUrl && !isUploading && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, imageUrl: "" }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Убрать
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Документ (необязательно)</label>
          <div className="flex items-center gap-3">
            {form.documentName && (
              <span className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="max-w-[180px] truncate">{form.documentName}</span>
              </span>
            )}
            <input
              ref={documentInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={handleDocumentChange}
              className="text-sm"
            />
            {isUploadingDocument && <span className="text-xs text-gray-500">Загрузка...</span>}
            {form.documentUrl && !isUploadingDocument && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, documentUrl: "", documentName: "" }));
                  if (documentInputRef.current) documentInputRef.current.value = "";
                }}
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Убрать
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Опубликовано
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
            />
            Закрепить на главной
          </label>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isUploading}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {editingId ? "Сохранить" : "Добавить новость"}
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
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-16 w-24 shrink-0 rounded-md border border-gray-200 object-cover"
                    />
                  )}
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-gray-900">
                      {item.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />}
                      {item.title}
                      {!item.isPublished && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">черновик</span>
                      )}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{item.content}</p>
                    {item.documentName && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {item.documentName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-sm text-brand-700 hover:underline dark:text-brand-300"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
