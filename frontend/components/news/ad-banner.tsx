import { cn } from '@/lib/utils'

export function AdBanner({
  size = 'leaderboard',
  className,
}: {
  size?: 'leaderboard' | 'box'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground',
        size === 'leaderboard' ? 'h-24 w-full sm:h-28' : 'aspect-square w-full',
        className,
      )}
      role="complementary"
      aria-label="Espaço publicitário"
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest">
        Publicidade
      </span>
      <span className="mt-1 text-xs">Anuncie aqui</span>
    </div>
  )
}
