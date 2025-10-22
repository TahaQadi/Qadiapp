
import { useLanguage } from "./LanguageProvider";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MobileDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MobileDatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  disabled = false,
  className,
}: MobileDatePickerProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const locale = language === "ar" ? ar : enUS;
  const isMobile = window.innerWidth < 768;

  const dateDisplay = value ? format(value, "PPP", { locale }) : placeholder;

  const calendarContent = (
    <Calendar
      mode="single"
      selected={value}
      onSelect={(date) => {
        onChange(date);
        setOpen(false);
      }}
      disabled={disabled}
      initialFocus
      locale={locale}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium">{label}</label>}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal min-h-[44px]",
                !value && "text-muted-foreground",
                className
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateDisplay}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>{label || "Select Date"}</SheetTitle>
            </SheetHeader>
            <div className="flex justify-center py-4">
              {calendarContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateDisplay}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {calendarContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}
