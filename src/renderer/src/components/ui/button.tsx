import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-foreground hover:brightness-110 shadow-[0_0_0_1px_rgb(198_255_61_/_0.2),0_8px_24px_-8px_rgb(198_255_61_/_0.45)]',
        secondary:
          'bg-surface-raised text-foreground border border-border hover:bg-surface-hover hover:border-border-strong',
        ghost: 'text-muted hover:text-foreground hover:bg-surface-hover',
        outline:
          'border border-border-strong bg-transparent text-foreground hover:bg-surface-hover',
        danger: 'bg-danger/15 text-danger hover:bg-danger/25'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button }
// eslint-disable-next-line react-refresh/only-export-components -- shadcn variant helper
export { buttonVariants }
