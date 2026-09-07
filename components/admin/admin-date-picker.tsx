"use client";

import { useEffect, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/format";

type AdminDatePickerProps = {
  name: string;
  defaultValue?: string;
  ariaLabel: string;
  placeholder?: string;
  includeTime?: boolean;
  required?: boolean;
};

const weekDays = ["یک", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"];

function parseDateValue(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date();
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string, time: string, includeTime: boolean) {
  if (!value) return "";
  const date = parseDateValue(value);
  const formatted = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { day: "numeric", month: "long", year: "numeric" }).format(date);
  return includeTime && time ? `${formatted}، ${time}` : formatted;
}

export function AdminDatePicker({ name, defaultValue = "", ariaLabel, placeholder = "انتخاب تاریخ", includeTime = false, required = false }: AdminDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initialDate = parseDateValue(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [time, setTime] = useState(defaultValue.slice(11, 16) || "09:00");
  const [viewDate, setViewDate] = useState(initialDate);
  const [open, setOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setTimeOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedDate = datePart(value);
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const calendarCells = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "long", year: "numeric" }).format(viewDate);
  const hour = time.slice(0, 2) || "09";
  const minute = time.slice(3, 5) || "00";
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

  function chooseDate(day: number) {
    const nextValue = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    setValue(includeTime ? `${nextValue}T${time}` : nextValue);
    if (!includeTime) setOpen(false);
  }

  function chooseTime(nextTime: string) {
    setTime(nextTime);
    if (selectedDate) setValue(`${selectedDate}T${nextTime}`);
  }

  function chooseHour(nextHour: string) {
    chooseTime(`${nextHour}:${minute}`);
  }

  function chooseMinute(nextMinute: string) {
    chooseTime(`${hour}:${nextMinute}`);
  }

  function clear() {
    setValue("");
    setTime("09:00");
    setTimeOpen(false);
    setOpen(false);
  }

  return <div ref={rootRef} className="admin-date-picker">
    <button type="button" className="admin-date-trigger" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((current) => !current)}>
      <span className={value ? "" : "is-placeholder"}>{displayDate(value, time, includeTime) || placeholder}</span>
      <svg className="admin-date-trigger-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M7 2.5v4M17 2.5v4M3 9.5h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </button>
    <input type="hidden" name={name} value={value} required={required} />
    {open ? <div className="admin-date-popover" role="dialog" aria-label={ariaLabel}>
      <div className="admin-date-header">
        <button type="button" aria-label="ماه بعد" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>‹</button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="ماه قبل" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>›</button>
      </div>
      <div className="admin-date-weekdays" aria-hidden="true">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="admin-date-grid">{calendarCells.map((day, index) => day ? <button key={day} type="button" className={selectedDate === formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ? "is-selected" : ""} aria-label={`${day} ${monthLabel}`} aria-current={selectedDate === formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ? "date" : undefined} onClick={() => chooseDate(day)}>{day.toLocaleString("fa-IR")}</button> : <span key={`empty-${index}`} aria-hidden="true" />)}</div>
      {includeTime ? <div className="admin-date-time-row">
        <div className="admin-date-time-heading"><span className="admin-date-time-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>ساعت جلسه</span><span className="admin-date-time-value">{toPersianDigits(time)}</span></div>
        <div className="admin-date-time-picker">
          <button type="button" className="admin-date-time-trigger" aria-label="انتخاب ساعت جلسه" aria-expanded={timeOpen} onClick={() => setTimeOpen((current) => !current)}><span>تغییر ساعت</span><span className={`site-header-consultation-chevron${timeOpen ? " is-open" : ""}`} aria-hidden="true" /></button>
          {timeOpen ? <div className="admin-date-time-menu" role="dialog" aria-label="انتخاب ساعت جلسه">
            <div className="admin-date-time-menu-title">زمان را انتخاب کنید</div>
            <div className="admin-date-time-columns">
              <div><span className="admin-date-time-column-label">ساعت</span><div className="admin-date-time-options">{hours.map((item) => <button key={item} type="button" className={item === hour ? "is-selected" : ""} aria-pressed={item === hour} onClick={() => chooseHour(item)}>{toPersianDigits(item)}</button>)}</div></div>
              <div><span className="admin-date-time-column-label">دقیقه</span><div className="admin-date-time-options">{minutes.map((item) => <button key={item} type="button" className={item === minute ? "is-selected" : ""} aria-pressed={item === minute} onClick={() => chooseMinute(item)}>{toPersianDigits(item)}</button>)}</div></div>
            </div>
            <button type="button" className="admin-date-time-confirm" onClick={() => setTimeOpen(false)}>ثبت ساعت</button>
          </div> : null}
        </div>
      </div> : null}
      <div className="admin-date-footer">
        {value ? <button type="button" className="admin-date-clear" onClick={clear}>پاک کردن</button> : <span aria-hidden="true" />}
        <button type="button" className="admin-date-close" onClick={() => { setTimeOpen(false); setOpen(false); }}>بستن تقویم</button>
      </div>
    </div> : null}
  </div>;
}
