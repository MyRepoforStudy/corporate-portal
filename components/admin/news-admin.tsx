"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, Pin, X } from "lucide-react";
import type { News, NewsCategory } from "@prisma/client";
import { useCrudList } from "@/lib/hooks/use-crud-list";

const emptyForm = {
  title: "",
  content: "",
  imageUrl: "",
  documentUrl: "",
  documentName: "",
  isPublished: true,
  isPinned: false,
  categoryId: "",
};

function CategoryManager({ categories, onChanged }: { categories: NewsCategory[]; onChanged: () => void }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/news-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось добавить категорию");
      return;
    }
    setNewName("");
    setError(null);
    onChanged();
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    const res = await fetch(`/api/news-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    setEditingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось переименовать категорию");
      return;
    }
    setError(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить категорию? Новости в ней останутся, просто без категории.")) return;
    const res = await fetch(`/api/news-categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось удалить категорию");
      return;
    }
    setError(null);
    onChanged();
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-medium text-gray-900">Категории новостей</h2>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pl-3 pr-1.5 text-xs"
          >
            {editingId === cat.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(cat.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(cat.id)}
                className="w-24 rounded border border-gray-300 bg-white px-1 text-gray-900"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingId(cat.id);
                  setEditingName(cat.name);
                }}
                className="text-gray-700 hover:text-brand-700 dark:hover:text-brand-300"
              >
                {cat.name}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(cat.id)}
              aria-label="Удалить категорию"
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={handleAdd} className="mt-2 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новая категория"
          className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
        >
          + Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function NewsAdmin() {
  const { items, isLoading, create, update, remove } = useCrudList<News & { category: NewsCategory | null }>(
    "/api/news"
  );
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  async function loadCategories() {
    const res = await fetch("/api/news-categories");
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => {
    loadCategories();
  }, []);

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

  function startEdit(item: News & { category: NewsCategory | null }) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl ?? "",
      documentUrl: item.documentUrl ?? "",
      documentName: item.documentName ?? "",
      isPublished: item.isPublished,
      isPinned: item.isPinned,
      categoryId: item.category?.id ?? "",
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

      <CategoryManager categories={categories} onChanged={loadCategories} />

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="text"
          placeholder="Заголовок"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />
        <textarea
          placeholder="Текст новости"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4}
          className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Категория</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm sm:w-64"
          >
            <option value="">Без категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

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
        {form.isPinned && (
          <p className="text-xs text-gray-500">
            При закреплении опубликованной новости всем пользователям портала уйдёт email-уведомление.
          </p>
        )}
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
                      {item.category && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          {item.category.name}
                        </span>
                      )}
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
