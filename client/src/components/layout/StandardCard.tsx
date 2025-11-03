import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StandardCardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  onClick?: () => void;
}

export function StandardCard({
  children,
  className = "",
  header,
  title,
  description,
  footer,
  onClick,
}: StandardCardProps): JSX.Element {
  const cardClasses = cn(
    "border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm",
    "hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300",
    onClick && "cursor-pointer",
    className
  );

  return (
    <Card className={cardClasses} onClick={onClick}>
      {(header || title || description) && (
        <CardHeader className="p-4 sm:p-6">
          {header}
          {title && (
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          )}
          {description && (
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        "p-4 sm:p-6",
        !header && !title && !description && "pt-6"
      )}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="p-4 sm:p-6 pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

