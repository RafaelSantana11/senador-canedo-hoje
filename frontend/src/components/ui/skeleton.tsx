import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-200/75",
        "after:pointer-events-none after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-shimmer after:bg-linear-to-r after:from-transparent after:via-foreground/[0.07] after:to-transparent",
        "motion-reduce:animate-pulse motion-reduce:after:hidden",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
