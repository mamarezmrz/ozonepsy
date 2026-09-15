"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { dispatchAdminNotification } from "@/components/admin/admin-notification-host";
import type { ContentStatus } from "@/lib/generated/prisma/enums";
import { faqPageDefinitions, type FaqPageKey } from "@/lib/public/faq-pages";

type FaqRow = { id: string; question: string; answer: string; pageKey: string; status: ContentStatus; sortOrder: number };
type FaqItem = { question: string; answer: string };
type FaqDraftItem = FaqItem & { key: string; id?: string; status?: ContentStatus; sortOrder: number };
type FaqApiBody = { ok?: boolean; message?: string; data?: { rows?: FaqRow[] } };

function makeDraftItems(rows: Array<FaqRow | FaqItem>): FaqDraftItem[] {
  return rows.map((row, index) => "id" in row
    ? { key: row.id, id: row.id, question: row.question, answer: row.answer, status: row.status, sortOrder: row.sortOrder }
    : { key: `default:${index}`, question: row.question, answer: row.answer, sortOrder: index });
}

function isSavedFaq(row: FaqDraftItem): row is FaqDraftItem & { id: string } {
  return Boolean(row.id);
}

export function AdminFaqManager({ pageKey, rows, defaults, canWrite }: { pageKey: FaqPageKey; rows: FaqRow[]; defaults: FaqItem[]; canWrite: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [orderDraft, setOrderDraft] = useState<FaqDraftItem[] | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [editingFaq, setEditingFaq] = useState<FaqDraftItem | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [deletingFaq, setDeletingFaq] = useState<FaqDraftItem | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const previousPositions = useRef<Map<string, number> | null>(null);
  const orderDraftRef = useRef<FaqDraftItem[] | null>(null);
  const activePointerId = useRef<number | null>(null);

  const visibleRows = rows.length ? rows.filter((row) => row.status !== "ARCHIVED") : defaults;
  const baseDraftRows = makeDraftItems(visibleRows);
  const displayRows = orderDraft ?? baseDraftRows;

  useEffect(() => {
    if (!editingFaq && !deletingFaq) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !pendingAction) {
        setEditingFaq(null);
        setDeletingFaq(null);
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [editingFaq, deletingFaq, pendingAction]);

  useLayoutEffect(() => {
    orderDraftRef.current = orderDraft;
    const firstPositions = previousPositions.current;
    if (!orderDraft || !firstPositions) return;
    previousPositions.current = null;

    const movingCards: HTMLElement[] = [];
    for (const [key, element] of cardRefs.current) {
      const firstTop = firstPositions.get(key);
      if (firstTop === undefined) continue;
      const deltaY = firstTop - element.getBoundingClientRect().top;
      if (Math.abs(deltaY) < 1) continue;
      element.style.transition = "none";
      element.style.transform = `translateY(${deltaY}px)`;
      movingCards.push(element);
    }

    const frame = window.requestAnimationFrame(() => {
      for (const element of movingCards) {
        element.style.transition = "transform 220ms cubic-bezier(.2,.8,.2,1)";
        element.style.transform = "translateY(0)";
      }
    });
    const cleanupTimer = window.setTimeout(() => {
      for (const element of movingCards) {
        element.style.transition = "";
        element.style.transform = "";
      }
    }, 250);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cleanupTimer);
    };
  }, [orderDraft]);

  async function ensureFaqRows() {
    const initializeResponse = await fetch("/api/admin/content/faq", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initializeDefaults: true, pageKey }),
    });
    const initializeBody = await initializeResponse.json() as { message?: string };
    if (!initializeResponse.ok && initializeResponse.status !== 409) {
      throw new Error(initializeBody.message ?? "سوال‌های این صفحه بارگذاری نشدند.");
    }

    const listResponse = await fetch(`/api/admin/content/faq?pageKey=${encodeURIComponent(pageKey)}&pageSize=100&sort=sortOrder&direction=asc`, { credentials: "same-origin", cache: "no-store" });
    const listBody = await listResponse.json() as FaqApiBody;
    if (!listResponse.ok || !listBody.ok || !listBody.data?.rows) {
      throw new Error(listBody.message ?? "سوال‌های این صفحه بارگذاری نشدند.");
    }
    return listBody.data.rows;
  }

  async function persistOrder(ids: string[]) {
    const response = await fetch("/api/admin/content/faq/reorder", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageKey, ids }),
    });
    const body = await response.json() as { ok?: boolean; message?: string };
    if (!response.ok || !body.ok) throw new Error(body.message ?? "ترتیب سوال‌ها ذخیره نشد.");
  }

  function startDraft() {
    if (orderDraftRef.current) return orderDraftRef.current;
    const initial = makeDraftItems(visibleRows);
    orderDraftRef.current = initial;
    setOrderDraft(initial);
    return initial;
  }

  function moveDraftItem(key: string, targetIndex: number) {
    const current = orderDraftRef.current ?? startDraft();
    const fromIndex = current.findIndex((item) => item.key === key);
    if (fromIndex < 0 || targetIndex < 0 || targetIndex >= current.length || fromIndex === targetIndex) return;

    previousPositions.current = new Map([...cardRefs.current].map(([itemKey, element]) => [itemKey, element.getBoundingClientRect().top]));
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(targetIndex, 0, moved);
    orderDraftRef.current = next;
    setOrderDraft(next);
    setOrderDirty(next.some((item, index) => item.key !== baseDraftRows[index]?.key));
  }

  function attachSavedRows(savedRows: FaqRow[]) {
    const current = orderDraftRef.current;
    if (!current) return;
    const next = current.map((item) => {
      if (item.id || !item.key.startsWith("default:")) return item;
      const originalIndex = Number(item.key.slice("default:".length));
      const saved = savedRows[originalIndex];
      return saved ? { ...item, id: saved.id, status: saved.status, sortOrder: saved.sortOrder } : item;
    });
    orderDraftRef.current = next;
    setOrderDraft(next);
  }

  function clearOrderDraft() {
    orderDraftRef.current = null;
    setOrderDraft(null);
    setOrderDirty(false);
    setDraggedKey(null);
  }

  function beginPointerDrag(event: PointerEvent<HTMLButtonElement>, key: string) {
    if (pendingAction || adding || editingFaq || deletingFaq) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerId.current = event.pointerId;
    startDraft();
    setDraggedKey(key);
  }

  function movePointerDrag(event: PointerEvent<HTMLDivElement>, key: string) {
    if (draggedKey !== key || pendingAction) return;
    const current = orderDraftRef.current;
    if (!current) return;
    const remaining = current.filter((item) => item.key !== key);
    if (remaining.length === current.length) return;
    let targetIndex = remaining.length;
    for (const [index, item] of remaining.entries()) {
      const card = cardRefs.current.get(item.key);
      if (card && event.clientY < card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2) {
        targetIndex = index;
        break;
      }
    }
    const fromIndex = current.findIndex((item) => item.key === key);
    if (targetIndex !== fromIndex) moveDraftItem(key, targetIndex);
  }

  function finishPointerDrag(pointerId: number) {
    if (activePointerId.current !== pointerId) return;
    activePointerId.current = null;
    setDraggedKey(null);
  }

  function handleDragKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string, index: number) {
    if (event.key === "Escape" && draggedKey === key) {
      event.preventDefault();
      setDraggedKey(null);
      return;
    }
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      if (draggedKey === key) {
        setDraggedKey(null);
      } else if (!pendingAction && !adding && !editingFaq && !deletingFaq) {
        startDraft();
        setDraggedKey(key);
      }
      return;
    }
    if (draggedKey === key && event.key === "ArrowUp") {
      event.preventDefault();
      moveDraftItem(key, index - 1);
    } else if (draggedKey === key && event.key === "ArrowDown") {
      event.preventDefault();
      moveDraftItem(key, index + 1);
    }
  }

  async function saveOrder() {
    const draft = orderDraftRef.current;
    if (!draft || !orderDirty || pendingAction) return;
    setPendingAction(true);
    try {
      let savedRows = rows.filter((row) => row.status !== "ARCHIVED");
      if (!savedRows.length) savedRows = await ensureFaqRows();
      const ids = draft.map((item) => {
        if (item.id) return item.id;
        const defaultIndex = Number(item.key.slice("default:".length));
        return savedRows[defaultIndex]?.id;
      });
      if (ids.some((id) => !id)) throw new Error("فهرست سوال‌ها تغییر کرده است؛ صفحه را تازه‌سازی کنید و دوباره تلاش کنید.");
      await persistOrder(ids as string[]);
      orderDraftRef.current = null;
      setOrderDraft(null);
      setOrderDirty(false);
      setDraggedKey(null);
      dispatchAdminNotification("ترتیب سوال‌ها ذخیره شد.");
      router.refresh();
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "ترتیب سوال‌ها ذخیره نشد.", "error");
    } finally {
      setPendingAction(false);
    }
  }

  async function openEditor(row: FaqDraftItem) {
    if (pendingAction) return;
    setPendingAction(true);
    try {
      let savedRow: FaqRow | undefined;
      if (isSavedFaq(row)) {
        savedRow = rows.find((item) => item.id === row.id) ?? { id: row.id, question: row.question, answer: row.answer, pageKey, status: row.status ?? "PUBLISHED", sortOrder: row.sortOrder };
      } else {
        const savedRows = await ensureFaqRows();
        attachSavedRows(savedRows);
        const originalIndex = Number(row.key.slice("default:".length));
        savedRow = savedRows[originalIndex];
      }
      if (!savedRow?.id) throw new Error("سوال برای ویرایش پیدا نشد.");
      setEditingFaq({ ...row, id: savedRow.id, sortOrder: savedRow.sortOrder });
      setEditQuestion(savedRow.question);
      setEditAnswer(savedRow.answer);
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "سوال برای ویرایش بارگذاری نشد.", "error");
    } finally {
      setPendingAction(false);
    }
  }

  async function saveEditedFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingFaq?.id) return;
    const cleanQuestion = editQuestion.trim();
    const cleanAnswer = editAnswer.trim();
    if (!cleanQuestion || !cleanAnswer) {
      dispatchAdminNotification("برای ذخیره، هم سوال و هم پاسخ را کامل کنید.", "error");
      return;
    }
    setPendingAction(true);
    try {
      const response = await fetch(`/api/admin/content/faq/${editingFaq.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageKey, question: cleanQuestion, answer: cleanAnswer, sortOrder: editingFaq.sortOrder }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ویرایش سوال انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("سوال با موفقیت ویرایش شد.");
      setEditingFaq(null);
      const currentDraft = orderDraftRef.current;
      if (currentDraft) {
        const nextDraft = currentDraft.map((item) => item.key === editingFaq.key ? { ...item, question: cleanQuestion, answer: cleanAnswer } : item);
        orderDraftRef.current = nextDraft;
        setOrderDraft(nextDraft);
      }
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPendingAction(false);
    }
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();
    if (!cleanQuestion || !cleanAnswer) {
      dispatchAdminNotification("برای ذخیره، هم سوال و هم پاسخ را کامل کنید.", "error");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/admin/content/faq", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageKey, question: cleanQuestion, answer: cleanAnswer, sortOrder: visibleRows.length }),
      });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) {
        dispatchAdminNotification(body.message ?? "ذخیره سوال انجام نشد.", "error");
        return;
      }
      dispatchAdminNotification("سوال با موفقیت اضافه شد.");
      setQuestion("");
      setAnswer("");
      setAdding(false);
      clearOrderDraft();
      router.refresh();
    } catch {
      dispatchAdminNotification("ارتباط با سرور برقرار نشد.", "error");
    } finally {
      setPending(false);
    }
  }

  async function deleteFaq() {
    if (!deletingFaq || pendingAction) return;
    setPendingAction(true);
    try {
      let id = deletingFaq.id;
      if (!id) {
        const defaultIndex = Number(deletingFaq.key.slice("default:".length));
        const savedRows = await ensureFaqRows();
        attachSavedRows(savedRows);
        id = savedRows[defaultIndex]?.id;
      }
      if (!id) throw new Error("سوال برای حذف پیدا نشد.");
      const response = await fetch(`/api/admin/content/faq/${id}`, { method: "DELETE", credentials: "same-origin" });
      const body = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !body.ok) throw new Error(body.message ?? "حذف سوال انجام نشد.");
      dispatchAdminNotification("سوال متداول حذف شد.");
      setDeletingFaq(null);
      const currentDraft = orderDraftRef.current;
      if (orderDirty && currentDraft) {
        const nextDraft = currentDraft.filter((item) => item.key !== deletingFaq.key && item.id !== id);
        if (nextDraft.length) {
          orderDraftRef.current = nextDraft;
          setOrderDraft(nextDraft);
        } else {
          clearOrderDraft();
        }
      } else {
        clearOrderDraft();
      }
      router.refresh();
    } catch (error) {
      dispatchAdminNotification(error instanceof Error ? error.message : "حذف سوال انجام نشد.", "error");
    } finally {
      setPendingAction(false);
    }
  }

  function closeModal(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !pendingAction) {
      setEditingFaq(null);
      setDeletingFaq(null);
    }
  }

  return <div className="admin-faq-manager" onPointerMove={(event) => {
    const pointerId = activePointerId.current;
    if (pointerId !== null && event.pointerId === pointerId && draggedKey) movePointerDrag(event, draggedKey);
  }} onPointerUp={(event) => finishPointerDrag(event.pointerId)} onPointerCancel={(event) => finishPointerDrag(event.pointerId)}>
    <nav className="admin-faq-tabs" aria-label="صفحات دارای سوالات متداول">
      {faqPageDefinitions.map((page) => <Link key={page.key} href={`/content/faq?pageKey=${page.key}`} className={`admin-faq-tab${page.key === pageKey ? " is-active" : ""}`} aria-current={page.key === pageKey ? "page" : undefined}>{page.label}</Link>)}
    </nav>

    <div className="admin-faq-list" aria-live="polite">
      {displayRows.length ? displayRows.map((row, index) => <article
        className={`admin-faq-item${draggedKey === row.key ? " is-dragging" : ""}`}
        key={row.key}
        data-faq-key={row.key}
        ref={(element) => { if (element) cardRefs.current.set(row.key, element); else cardRefs.current.delete(row.key); }}
      >
        <div className="admin-faq-item-number" aria-hidden="true">{(index + 1).toLocaleString("fa-IR")}</div>
        <div className="admin-faq-item-copy">
          <h3>{row.question}</h3>
          <p>{row.answer}</p>
        </div>
        {canWrite ? <div className="admin-faq-item-actions">
          <button type="button" className="admin-faq-icon-button admin-faq-drag-handle" aria-label={`جابجایی سوال ${index + 1}`} aria-pressed={draggedKey === row.key} title="برای تغییر ترتیب بکشید" disabled={pendingAction || adding || Boolean(editingFaq) || Boolean(deletingFaq)}
            onPointerDown={(event) => beginPointerDrag(event, row.key)}
            onKeyDown={(event) => handleDragKeyDown(event, row.key, index)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="6" r="1.4" /><circle cx="16" cy="6" r="1.4" /><circle cx="8" cy="12" r="1.4" /><circle cx="16" cy="12" r="1.4" /><circle cx="8" cy="18" r="1.4" /><circle cx="16" cy="18" r="1.4" /></svg>
          </button>
          <button type="button" className="admin-faq-icon-button" aria-label={`ویرایش سوال ${index + 1}`} title="ویرایش سوال و پاسخ" onClick={() => void openEditor(row)} disabled={pendingAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15.8 4.2 4 4M4 20l4.4-.9L19 8.5a2.1 2.1 0 0 0-3-3L5.4 16.1 4 20Z" /></svg>
          </button>
          <button type="button" className="admin-faq-icon-button admin-faq-delete-button" aria-label={`حذف سوال ${index + 1}`} title="حذف سوال" onClick={() => setDeletingFaq(row)} disabled={pendingAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6.5 7l.8 13h9.4l.8-13M9 7V4h6v3" /></svg>
          </button>
        </div> : null}
      </article>) : <div className="admin-faq-empty">برای این صفحه هنوز سوالی ثبت نشده است.</div>}
    </div>

    {canWrite ? <>
      <div className="admin-faq-add-area">
        {adding ? <form className="admin-faq-add-form" onSubmit={saveQuestion}>
          <label className="admin-form-field"><span>سوال</span><input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} required /></label>
          <label className="admin-form-field"><span>پاسخ</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={10000} required /></label>
          <div className="admin-faq-add-actions">
            <button type="button" className="admin-button admin-button-secondary" onClick={() => { setAdding(false); setQuestion(""); setAnswer(""); }} disabled={pending}>انصراف</button>
            <button type="submit" className="admin-button admin-button-primary" disabled={pending || !question.trim() || !answer.trim()}>{pending ? "در حال ذخیره…" : "ذخیره سوال"}</button>
          </div>
        </form> : <button type="button" className="admin-button admin-button-secondary admin-faq-add-button" onClick={() => setAdding(true)} disabled={pendingAction || orderDirty}>+ افزودن سوال</button>}
      </div>

      <div className="admin-faq-footer">
        <button type="button" className="admin-button admin-button-primary" onClick={() => void saveOrder()} disabled={!orderDirty || pendingAction}>{pendingAction ? "در حال ذخیره…" : "ذخیره ترتیب"}</button>
      </div>
    </> : null}

    {editingFaq ? <div className="admin-faq-modal-backdrop" role="presentation" onMouseDown={closeModal}>
      <section className="admin-faq-modal" role="dialog" aria-modal="true" aria-labelledby="admin-faq-modal-title">
        <header className="admin-faq-modal-header"><div><span>مدیریت سوال</span><h2 id="admin-faq-modal-title">ویرایش سوال و پاسخ</h2></div><button type="button" aria-label="بستن" onClick={() => setEditingFaq(null)} disabled={pendingAction}>×</button></header>
        <form className="admin-faq-add-form" onSubmit={saveEditedFaq}>
          <label className="admin-form-field"><span>سوال</span><input value={editQuestion} onChange={(event) => setEditQuestion(event.target.value)} maxLength={2000} required /></label>
          <label className="admin-form-field"><span>پاسخ</span><textarea value={editAnswer} onChange={(event) => setEditAnswer(event.target.value)} maxLength={10000} required /></label>
          <div className="admin-faq-add-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setEditingFaq(null)} disabled={pendingAction}>انصراف</button><button type="submit" className="admin-button admin-button-primary" disabled={pendingAction || !editQuestion.trim() || !editAnswer.trim()}>{pendingAction ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></div>
        </form>
      </section>
    </div> : null}

    {deletingFaq ? <div className="admin-faq-modal-backdrop" role="presentation" onMouseDown={closeModal}>
      <section className="admin-faq-modal admin-faq-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="admin-faq-delete-title" aria-describedby="admin-faq-delete-description">
        <header className="admin-faq-modal-header"><div><span>حذف سوال</span><h2 id="admin-faq-delete-title">از حذف این سوال مطمئن هستید؟</h2></div><button type="button" aria-label="بستن" onClick={() => setDeletingFaq(null)} disabled={pendingAction}>×</button></header>
        <p id="admin-faq-delete-description" className="admin-faq-delete-copy">«{deletingFaq.question}»</p>
        <div className="admin-faq-add-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setDeletingFaq(null)} disabled={pendingAction}>انصراف</button><button type="button" className="admin-button admin-faq-confirm-delete" onClick={() => void deleteFaq()} disabled={pendingAction}>{pendingAction ? "در حال حذف…" : "حذف سوال"}</button></div>
      </section>
    </div> : null}
  </div>;
}
