import { ArrowRightIcon } from "@radix-ui/react-icons";
import { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface BentoGridItemProps extends ComponentPropsWithoutRef<"div"> {
  title: string;
  description: string;
  header: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  className,
  title,
  description,
  header,
  icon = <ArrowRightIcon className="h-4 w-4" />,
  ...props
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-transparent bg-gradient-to-b from-border/50 to-border/20 p-6 shadow-lg shadow-black/10 transition duration-300 hover:shadow-xl hover:shadow-black/20",
        className
      )}
      {...props}
    >
      <div className="space-y-4">
        <div className="flex h-full flex-col justify-between rounded-xl bg-white/90 p-6 shadow-lg shadow-black/10 transition duration-300 group-hover/bento:shadow-xl group-hover/bento:shadow-black/20 dark:bg-black/80">
          {header}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border border-border bg-gradient-to-b from-border/50 to-border/20 p-1.5">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};
