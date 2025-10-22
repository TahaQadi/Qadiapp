
import { useEffect, useRef } from "react";
import { useLanguage } from "./LanguageProvider";

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  autoFocusFirst?: boolean;
  className?: string;
}

export function MobileForm({ children, onSubmit, autoFocusFirst = true, className = "" }: MobileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { language } = useLanguage();
  const isRTL = language === "ar";

  useEffect(() => {
    if (autoFocusFirst && formRef.current) {
      const firstInput = formRef.current.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled])'
      );
      if (firstInput) {
        // Delay to avoid mobile keyboard issues
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [autoFocusFirst]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={className}
      dir={isRTL ? "rtl" : "ltr"}
      noValidate
    >
      {children}
    </form>
  );
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function MobileInput({ label, error, helperText, className = "", ...props }: MobileInputProps) {
  const inputId = props.id || `mobile-input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`flex h-11 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function MobileTextarea({ label, error, helperText, className = "", ...props }: MobileTextareaProps) {
  const inputId = props.id || `mobile-textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
