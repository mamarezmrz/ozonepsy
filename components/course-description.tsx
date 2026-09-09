export function CourseDescription({ description, className = "", clamp = false }: { description: string; className?: string; clamp?: boolean }) {
  return <p className={`course-description${clamp ? " course-description-clamped" : ""} ${className}`.trim()}>{description}</p>;
}
