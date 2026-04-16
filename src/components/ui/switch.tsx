import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "#/lib/utils";

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200",
  {
    variants: {
      variant: {
        default: "",
        ios: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 border-0",
      },
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default:
          "data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        ios: "data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-3.5 data-[state=unchecked]:w-7 data-[state=checked]:w-7",
      },
      size: {
        default: "h-5 w-5",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4",
      },
    },
    compoundVariants: [
      {
        variant: "ios",
        size: "sm",
        className:
          "data-[state=checked]:translate-x-3 data-[state=checked]:w-5.5",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, variant, size, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(switchVariants({ variant, size, className }))}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb className={cn(thumbVariants({ variant, size }))} />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
