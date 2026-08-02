import { cn } from "@/lib/utils"

export function CategoryBadge({
  category,
  urgent,
  className,
}: {
  category: string
  urgent?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        urgent ? "bg-red-500 text-white" : "bg-background text-primary",
        className
      )}
    >
      {urgent ? "Urgente" : category}
    </span>
  )
}
