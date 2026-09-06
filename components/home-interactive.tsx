"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { toPersianDigits } from "@/lib/format";

type FaqItem = { question: string; answer: string };
type TestimonialItem = { name: string; avatar: string; text: string };

export function HomeFaq({ items = [] }: { items?: readonly FaqItem[] }) {
  const [open, setOpen] = useState(-1);
  if (!items.length) return <p className="home-empty-state">پرسش متداولی برای نمایش ثبت نشده است.</p>;
  return <div className="home-faq-list">{items.map(({ question, answer }, index) => <div key={question} className="home-faq-item">
    <button type="button" aria-expanded={open === index} className="focus-ring home-faq-question" onClick={() => setOpen(open === index ? -1 : index)}><span className="home-faq-icon" aria-hidden="true">{open === index ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12H19" stroke="#CC6F39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19" stroke="#CC6F39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 12H19" stroke="#CC6F39" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span><span>{question}</span></button>
    <div className={`home-faq-answer-wrap${open === index ? " is-open" : ""}`} aria-hidden={open !== index}><div className="home-faq-answer">{answer}</div></div>
  </div>)}</div>;
}

export function HomeTestimonials({ items = [] }: { items?: readonly TestimonialItem[] }) {
  const [active, setActive] = useState(7);
  const [isJumping, setIsJumping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const cards = items;
  if (!cards.length) return <p className="home-empty-state">نظری برای نمایش ثبت نشده است.</p>;
  const repeatedCards = [...cards, ...cards, ...cards];
  const selected = active % cards.length;
  const trackStyle = { "--testimonial-index": active } as CSSProperties;
  const movePrevious = () => setActive((current) => current - 1);
  const moveNext = () => setActive((current) => current + 1);
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    if (Math.abs(distance) >= 48) {
      if (distance < 0) moveNext();
      else movePrevious();
    }
    dragStartX.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handlePointerCancel = () => {
    dragStartX.current = null;
    setIsDragging(false);
  };
  const handleTrackTransitionEnd = () => {
    if (active >= cards.length * 2 || active < cards.length) {
      setIsJumping(true);
      setActive((current) => current >= cards.length * 2 ? current - cards.length : current + cards.length);
      requestAnimationFrame(() => requestAnimationFrame(() => setIsJumping(false)));
    }
  };
  return <div className="home-testimonial-wrap"><div className={`home-testimonial-track${isJumping ? " is-jumping" : ""}${isDragging ? " is-dragging" : ""}`} style={trackStyle} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onTransitionEnd={handleTrackTransitionEnd}>{repeatedCards.map(({ name, avatar, text }, index) => <article key={`${name}-${index}`} className={`home-testimonial-card ${index % cards.length === selected ? "is-active" : ""}`}><div className="home-testimonial-top"><Image className="home-avatar" src={avatar.startsWith("/") ? avatar : `/figma-home/${avatar}`} alt="" width={48} height={48} /><span>{name}</span></div><div className="home-testimonial-body"><p>{text}</p></div></article>)}</div><div className="home-carousel-controls"><button type="button" className="focus-ring" aria-label="نظر قبلی" onClick={movePrevious}><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button><div className="home-dots">{cards.map((_, index) => <button type="button" key={index} aria-label={`نظر ${toPersianDigits(index + 1)}`} className={index === selected ? "active" : ""} onClick={() => setActive(cards.length + index)} />)}</div><button type="button" className="focus-ring" aria-label="نظر بعدی" onClick={moveNext}><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div></div>;
}

const socialImages = [
  ["social-2.png", "ویدیوی آموزشی اُزون"],
  ["hero-1.png", "گفت‌وگوی صمیمی"],
  ["category-2.png", "مشاوره روانشناسی"],
  ["hero-2.png", "گفت‌وگوی صمیمی"],
] as const;

export function HomeSocialCarousel() {
  const [active, setActive] = useState<number>(socialImages.length);
  const [step, setStep] = useState(284);
  const [isJumping, setIsJumping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const repeatedImages = [...socialImages, ...socialImages, ...socialImages];
  useEffect(() => {
    const updateStep = () => setStep(window.innerWidth <= 900 ? 244 : 284);
    updateStep();
    window.addEventListener("resize", updateStep);
    return () => window.removeEventListener("resize", updateStep);
  }, []);
  const trackStyle = { "--social-shift": `${(active - socialImages.length) * step}px` } as CSSProperties;

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    const distance = event.clientX - dragStartX.current;
    if (Math.abs(distance) >= 48) setActive((current) => current + (distance < 0 ? 1 : -1));
    dragStartX.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handlePointerCancel = () => {
    dragStartX.current = null;
    setIsDragging(false);
  };

  const handleTrackTransitionEnd = () => {
    if (active >= socialImages.length * 2 || active < socialImages.length) {
      setIsJumping(true);
      setActive((current) => current >= socialImages.length * 2 ? current - socialImages.length : current + socialImages.length);
      requestAnimationFrame(() => requestAnimationFrame(() => setIsJumping(false)));
    }
  };

  return <div className={`home-social-carousel${isDragging ? " is-dragging" : ""}`} aria-label="محتوای شبکه‌های اجتماعی" style={trackStyle} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}><div className={`home-social-track${isJumping ? " is-jumping" : ""}${isDragging ? " is-dragging" : ""}`} onTransitionEnd={handleTrackTransitionEnd}>{repeatedImages.map(([image, alt], index) => <div className="home-social-photo" key={`${image}-${index}`}><Image className="home-social-template" src="/figma-home/social-template.png" alt="" fill sizes="260px" /><div className="home-social-photo-media"><Image src={`/figma-home/${image}`} alt={alt} fill sizes="230px" /></div></div>)}</div></div>;
}
