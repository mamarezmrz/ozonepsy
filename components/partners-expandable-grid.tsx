"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type PartnerItem = {
  name: string;
  description: string;
  image: string;
  href?: string;
};

type PartnersExpandableGridProps = {
  title: string;
  items: PartnerItem[];
  variant: "institution" | "therapist";
};

function getInitialVisibleCount() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 560) return 1;
  if (window.innerWidth <= 900) return 2;
  return 3;
}

export function PartnersExpandableGrid({ title, items, variant }: PartnersExpandableGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getInitialVisibleCount());
      setExpanded(false);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const initialItems = items.slice(0, visibleCount);
  const extraItems = items.slice(visibleCount);

  return (
    <section className={`partners-collection partners-collection-${variant}`} aria-labelledby={`${variant}-partners-title`}>
      <h2 id={`${variant}-partners-title`}>{title}</h2>
      <div className={`partners-list-shell${expanded ? " is-expanded" : ""}${extraItems.length ? " has-more" : ""}`}>
        <div className="partners-grid">
          {initialItems.map((item, index) => <PartnerCard key={`${variant}-${item.image}-${index}`} item={item} variant={variant} />)}
          <div className={`partners-extra${expanded ? " is-open" : ""}`} aria-hidden={!expanded}>{extraItems.map((item, index) => <PartnerCard key={`${variant}-extra-${item.image}-${index}`} item={item} variant={variant} />)}</div>
        </div>
      </div>
      {extraItems.length > 0 && (
        <button type="button" className="partners-more-button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          <span>{expanded ? "بستن" : "مشاهده بیشتر"}</span>
          <span className={`partners-more-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function PartnerCard({ item, variant }: { item: PartnerItem; variant: "institution" | "therapist" }) {
  const card = (
    <article className={`partner-card partner-card-${variant}`}>
      <div className="partner-card-media">
        <Image src={item.image} alt={item.name} fill unoptimized={item.image.startsWith("http")} sizes="(max-width: 560px) 100vw, (max-width: 900px) 45vw, 300px" />
      </div>
      <div className="partner-card-body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
      </div>
    </article>
  );

  return item.href ? <Link href={item.href} className="partner-card-link" aria-label={`مشاهده ${item.name}`}>{card}</Link> : card;
}
