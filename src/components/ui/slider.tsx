import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/cn'

export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-emerald-900">
        <SliderPrimitive.Range className="absolute h-full bg-lime-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-lime-300 bg-white shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-400" />
    </SliderPrimitive.Root>
  )
}
