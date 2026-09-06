import type { ReactNode } from "react";
import Link from "next/link";

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="admin-page-heading"><div className="admin-page-heading-copy">{eyebrow ? <span className="admin-page-heading-eyebrow">{eyebrow}</span> : null}<h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action ? <div className="admin-page-heading-action">{action}</div> : null}</div>;
}

export function AdminButton({ children, href, variant = "primary", type = "button", disabled = false, onClick }: { children: ReactNode; href?: string; variant?: "primary" | "secondary" | "danger"; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void }) {
  const className = `admin-button admin-button-${variant}`;
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return <button type={type} className={className} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function AdminStatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`admin-status-badge admin-status-${tone}`}>{children}</span>;
}

export function AdminEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="admin-empty-state"><h3>{title}</h3>{description ? <p>{description}</p> : null}{action ? <div className="admin-empty-action">{action}</div> : null}</div>;
}

export function AdminLoadingState({ label = "در حال بارگذاری…" }: { label?: string }) {
  return <div className="admin-loading-state" aria-busy="true"><span className="admin-loading-spinner" aria-hidden="true" />{label}</div>;
}

export function AdminListToolbar({ action, children }: { action?: ReactNode; children?: ReactNode }) {
  return <div className="admin-list-toolbar"><form method="get" className="admin-list-filters">{children}<AdminButton type="submit" variant="secondary">اعمال فیلتر</AdminButton></form>{action ? <div>{action}</div> : null}</div>;
}

export function AdminSearchInput({ defaultValue = "", placeholder = "جست‌وجو…" }: { defaultValue?: string; placeholder?: string }) {
  return <label className="admin-search-field"><span>جست‌وجو</span><input name="search" defaultValue={defaultValue} placeholder={placeholder} /></label>;
}

export type AdminTableColumn<Row> = { key: string; label: string; className?: string; render: (row: Row) => ReactNode };

export function AdminDataTable<Row>({ columns, rows, getRowKey, empty }: { columns: AdminTableColumn<Row>[]; rows: Row[]; getRowKey: (row: Row) => string; empty?: ReactNode }) {
  if (rows.length === 0) return <>{empty}</>;
  return (
    <div className="admin-table-wrap">
      <table className="admin-data-table">
        <caption className="sr-only">جدول داده‌های پنل مدیریت</caption>
        <thead><tr>{columns.map((column) => <th key={column.key} className={column.className}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={getRowKey(row)}>{columns.map((column) => <td key={column.key} className={column.className} data-label={column.label}>{column.render(row)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function AdminPagination({ page, pageCount, searchParams = {} }: { page: number; pageCount: number; searchParams?: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const makeHref = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) if (value) params.set(key, value);
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };
  return <nav className="admin-pagination" aria-label="صفحه‌بندی"><span>صفحه {page} از {pageCount}</span><div>{page > 1 ? <Link href={makeHref(page - 1)}>قبلی</Link> : null}{page < pageCount ? <Link href={makeHref(page + 1)}>بعدی</Link> : null}</div></nav>;
}

export function AdminField({ label, name, defaultValue, type = "text", required = false, children }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; children?: ReactNode }) {
  return <label className="admin-form-field"><span>{label}</span>{children ?? <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />}</label>;
}
