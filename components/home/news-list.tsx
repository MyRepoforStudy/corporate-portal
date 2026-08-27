"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Heart, MessageCircle, Newspaper, Paperclip, Pin, X } from "lucide-react";
import type { News, NewsCategory } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000;

type NewsWithMeta = News & {
  category: NewsCategory | null;
  _count: { likes: number; comments: number };
  likes: { id: string }[];
};

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string };
}

function isRecent(date: Date | string) {
  return Date.now() - new Date(date).getTime() < RECENT_THRESHOLD_MS;
}

function NewBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm ${className ?? ""}`}
    >
      {label}
    </span>
  );
}

function PinBadge({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
      <Pin className="h-2.5 w-2.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function DocumentLink({ item, documentFallback }: { item: News; documentFallback: string }) {
  if (!item.documentUrl) return null;
  return (
    <a
      href={item.documentUrl}
      download={item.documentName ?? undefined}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="max-w-[240px] truncate">{item.documentName ?? documentFallback}</span>
    </a>
  );
}

function NewsCard({
  item,
  locale,
  newBadge,
  dict,
  onOpen,
  onToggleLike,
  size = "default",
}: {
  item: NewsWithMeta;
  locale: Locale;
  newBadge: string;
  dict: Dictionary["newsBoard"];
  onOpen: () => void;
  onToggleLike: () => void;
  size?: "default" | "large";
}) {
  const showBadge = isRecent(item.createdAt);
  const likedByMe = item.likes.length > 0;
  const isLarge = size === "large";

  return (
    <article
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className={`w-full object-cover ${isLarge ? "h-56 sm:h-72" : "h-36"}`}
        />
      ) : (
        <div className={`flex w-full items-center justify-center bg-gray-100 ${isLarge ? "h-56 sm:h-72" : "h-36"}`}>
          <Newspaper className={isLarge ? "h-12 w-12 text-gray-300" : "h-8 w-8 text-gray-300"} aria-hidden="true" />
        </div>
      )}
      <div className={`flex flex-1 flex-col ${isLarge ? "p-4" : "p-3"}`}>
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {item.isPinned && <PinBadge label={dict.pinnedBadge} />}
          {showBadge && <NewBadge label={newBadge} />}
          {item.category && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {item.category.name}
            </span>
          )}
        </div>
        <h3
          className={`line-clamp-2 font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300 ${
            isLarge ? "text-lg sm:text-xl" : "text-sm"
          }`}
        >
          {item.title}
        </h3>
        <p className={`mt-1 flex-1 text-gray-600 ${isLarge ? "line-clamp-3 text-sm" : "line-clamp-2 text-xs"}`}>
          {item.content}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{formatDateLong(item.createdAt, locale, true)}</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1" aria-label={dict.viewsAriaLabel} title={dict.viewsAriaLabel}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {item.views}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike();
              }}
              aria-label={dict.likesAriaLabel}
              className={`flex items-center gap-1 transition ${
                likedByMe ? "text-brand-600" : "hover:text-brand-600"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${likedByMe ? "fill-current" : ""}`} aria-hidden="true" />
              {item._count.likes}
            </button>
            <span
              className="flex items-center gap-1"
              aria-label={dict.commentsAriaLabel}
              title={dict.commentsAriaLabel}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {item._count.comments}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Compact horizontal row used next to the featured (large) card - thumbnail
 * + title/date/counts, no inline like toggle (open the card for that). */
function CompactNewsCard({
  item,
  locale,
  dict,
  onOpen,
}: {
  item: NewsWithMeta;
  locale: Locale;
  dict: Dictionary["newsBoard"];
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer gap-3 rounded-lg border border-gray-200 bg-white p-2 transition hover:border-brand-300 hover:shadow-sm"
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100">
          <Newspaper className="h-5 w-5 text-gray-300" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {item.title}
        </h4>
        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-gray-500">
          <span>{formatDateLong(item.createdAt, locale, true)}</span>
          <span className="flex items-center gap-1" aria-label={dict.viewsAriaLabel}>
            <Eye className="h-3 w-3" aria-hidden="true" />
            {item.views}
          </span>
          <span className="flex items-center gap-1" aria-label={dict.commentsAriaLabel}>
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {item._count.comments}
          </span>
        </div>
      </div>
    </article>
  );
}

function NewsDetailModal({
  item,
  locale,
  dict,
  common,
  onClose,
  onToggleLike,
  onCommentCountChange,
}: {
  item: NewsWithMeta;
  locale: Locale;
  dict: Dictionary["newsBoard"];
  common: Dictionary["common"];
  onClose: () => void;
  onToggleLike: () => void;
  onCommentCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewedRef = useRef(false);
  const likedByMe = item.likes.length > 0;

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      fetch(`/api/news/${item.id}/view`, { method: "POST" }).catch(() => {});
    }
    fetch(`/api/news/${item.id}/comments`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setComments)
      .catch(() => setComments([]));
  }, [item.id]);

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentText.trim()) return;
    setIsPosting(true);
    setError(null);
    const res = await fetch(`/api/news/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });
    setIsPosting(false);
    if (!res.ok) {
      setError(dict.commentPostFailed);
      return;
    }
    const created: CommentItem = await res.json();
    setComments((prev) => [...(prev ?? []), created]);
    setCommentText("");
    onCommentCountChange(1);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm(dict.commentDeleteConfirm)) return;
    const res = await fetch(`/api/news/${item.id}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) {
      setError(dict.commentDeleteFailed);
      return;
    }
    setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
    onCommentCountChange(-1);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="max-h-[50vh] w-full bg-gray-50 object-contain" />
        )}
        <div className="p-6">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={common.close}
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>{formatDateLong(item.createdAt, locale, true)}</span>
            {item.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {item.category.name}
              </span>
            )}
          </div>
          <p className="whitespace-pre-line text-sm text-gray-700">{item.content}</p>
          <DocumentLink item={item} documentFallback={common.document} />

          <div className="mt-4 flex items-center gap-4 border-y border-gray-100 py-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5" aria-label={dict.viewsAriaLabel}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              {item.views}
            </span>
            <button
              type="button"
              onClick={onToggleLike}
              aria-label={dict.likesAriaLabel}
              className={`flex items-center gap-1.5 transition ${
                likedByMe ? "text-brand-600" : "hover:text-brand-600"
              }`}
            >
              <Heart className={`h-4 w-4 ${likedByMe ? "fill-current" : ""}`} aria-hidden="true" />
              {item._count.likes}
            </button>
            <span className="flex items-center gap-1.5" aria-label={dict.commentsAriaLabel}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {item._count.comments}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-gray-900">{dict.commentsTitle}</h3>
            {comments === null ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-gray-500">{dict.commentEmpty}</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-md bg-gray-50 p-2.5 text-sm">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900">{c.author.displayName}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-gray-500">{formatDateLong(c.createdAt, locale, true)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          aria-label={common.close}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <p className="whitespace-pre-line text-gray-700">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={dict.commentPlaceholder}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={isPosting || !commentText.trim()}
                className="shrink-0 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isPosting ? dict.commentSubmitting : dict.commentSubmit}
              </button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsList({
  news,
  categories,
  locale,
  title,
  emptyText,
  newBadge,
  common,
  dict,
}: {
  news: NewsWithMeta[];
  categories: NewsCategory[];
  locale: Locale;
  title: string;
  emptyText: string;
  newBadge: string;
  common: Dictionary["common"];
  dict: Dictionary["newsBoard"];
}) {
  const [newsState, setNewsState] = useState(news);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  if (news.length === 0) {
    return (
      <div>
        <h2 id="news" className="mb-3 scroll-mt-6 text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  const filtered = activeCategoryId
    ? newsState.filter((item) => item.categoryId === activeCategoryId)
    : newsState;
  const openItem = openItemId ? newsState.find((item) => item.id === openItemId) ?? null : null;

  async function handleToggleLike(id: string) {
    const target = newsState.find((item) => item.id === id);
    if (!target) return;
    const wasLiked = target.likes.length > 0;

    setNewsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              likes: wasLiked ? [] : [{ id: "optimistic" }],
              _count: { ...item._count, likes: item._count.likes + (wasLiked ? -1 : 1) },
            }
          : item
      )
    );

    const res = await fetch(`/api/news/${id}/like`, { method: "POST" });
    if (!res.ok) {
      // revert on failure
      setNewsState((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likes: wasLiked ? [{ id: "optimistic" }] : [],
                _count: { ...item._count, likes: item._count.likes + (wasLiked ? 1 : -1) },
              }
            : item
        )
      );
      return;
    }
    const body = await res.json();
    setNewsState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, likes: body.liked ? [{ id: "server" }] : [], _count: { ...item._count, likes: body.count } }
          : item
      )
    );
  }

  function handleCommentCountChange(id: string, delta: number) {
    setNewsState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, _count: { ...item._count, comments: item._count.comments + delta } } : item
      )
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="news" className="scroll-mt-6 text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCategoryId(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategoryId === null
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {dict.allFilter}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryId(cat.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeCategoryId === cat.id
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          <NewsCard
            item={filtered[0]}
            locale={locale}
            newBadge={newBadge}
            dict={dict}
            size="large"
            onOpen={() => setOpenItemId(filtered[0].id)}
            onToggleLike={() => handleToggleLike(filtered[0].id)}
          />
          {filtered.length > 1 && (
            <div className="flex flex-col gap-3">
              {filtered.slice(1, 4).map((item) => (
                <CompactNewsCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  dict={dict}
                  onOpen={() => setOpenItemId(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length > 4 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(4).map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              locale={locale}
              newBadge={newBadge}
              dict={dict}
              onOpen={() => setOpenItemId(item.id)}
              onToggleLike={() => handleToggleLike(item.id)}
            />
          ))}
        </div>
      )}

      {openItem && (
        <NewsDetailModal
          item={openItem}
          locale={locale}
          dict={dict}
          common={common}
          onClose={() => setOpenItemId(null)}
          onToggleLike={() => handleToggleLike(openItem.id)}
          onCommentCountChange={(delta) => handleCommentCountChange(openItem.id, delta)}
        />
      )}
    </>
  );
}
