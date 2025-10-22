
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { CalendarIcon, FilterX, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Translation helper
const t = (key: string, en: string, ar: string, language: string) => {
  return language === 'ar' ? ar : en;
};

interface OrderFiltersProps {
  onFilterChange: (filters: OrderFilterState) => void;
  showClientFilter?: boolean;
  availableLTAs?: Array<{ id: string; ltaNumber: string }>;
}

export interface OrderFilterState {
  searchTerm: string;
  status: string;
  ltaId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export function OrderFilters({ onFilterChange, showClientFilter = false, availableLTAs = [] }: OrderFiltersProps) {
  const { language, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  
  const [filters, setFilters] = useState<OrderFilterState>({
    searchTerm: "",
    status: "all",
    ltaId: "all",
    dateFrom: undefined,
    dateTo: undefined,
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const updateFilter = (key: keyof OrderFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: OrderFilterState = {
      searchTerm: "",
      status: "all",
      ltaId: "all",
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: "",
      maxAmount: "",
      sortBy: "date",
      sortOrder: "desc",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.searchTerm !== "" ||
    filters.status !== "all" ||
    filters.ltaId !== "all" ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "";

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {t("filters", "Filters", "المرشحات", language)}
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <FilterX className="h-4 w-4" />
            {t("clearFilters", "Clear Filters", "مسح المرشحات", language)}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>{t("search", "Search", "بحث", language)}</Label>
          <div className="relative">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              placeholder={t("searchOrders", "Search orders...", "البحث في الطلبات...", language)}
              value={filters.searchTerm}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
              className={cn(isRTL ? "pr-10" : "pl-10")}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>{t("status", "Status", "الحالة", language)}</Label>
          <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses", "All Statuses", "جميع الحالات", language)}</SelectItem>
              <SelectItem value="pending">{t("pending", "Pending", "قيد الانتظار", language)}</SelectItem>
              <SelectItem value="confirmed">{t("confirmed", "Confirmed", "مؤكد", language)}</SelectItem>
              <SelectItem value="processing">{t("processing", "Processing", "قيد المعالجة", language)}</SelectItem>
              <SelectItem value="shipped">{t("shipped", "Shipped", "تم الشحن", language)}</SelectItem>
              <SelectItem value="delivered">{t("delivered", "Delivered", "تم التسليم", language)}</SelectItem>
              <SelectItem value="cancelled">{t("cancelled", "Cancelled", "ملغي", language)}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LTA Filter */}
        {availableLTAs.length > 0 && (
          <div className="space-y-2">
            <Label>{t("lta", "LTA", "الاتفاقية", language)}</Label>
            <Select value={filters.ltaId} onValueChange={(value) => updateFilter("ltaId", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLTAs", "All LTAs", "جميع الاتفاقيات", language)}</SelectItem>
                {availableLTAs.map((lta) => (
                  <SelectItem key={lta.id} value={lta.id}>
                    {lta.ltaNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date From */}
        <div className="space-y-2">
          <Label>{t("dateFrom", "Date From", "من تاريخ", language)}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "PPP") : t("pickDate", "Pick a date", "اختر تاريخ", language)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => updateFilter("dateFrom", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>{t("dateTo", "Date To", "إلى تاريخ", language)}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "PPP") : t("pickDate", "Pick a date", "اختر تاريخ", language)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => updateFilter("dateTo", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Min Amount */}
        <div className="space-y-2">
          <Label>{t("minAmount", "Min Amount", "الحد الأدنى", language)}</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={filters.minAmount}
            onChange={(e) => updateFilter("minAmount", e.target.value)}
          />
        </div>

        {/* Max Amount */}
        <div className="space-y-2">
          <Label>{t("maxAmount", "Max Amount", "الحد الأقصى", language)}</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={filters.maxAmount}
            onChange={(e) => updateFilter("maxAmount", e.target.value)}
          />
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label>{t("sortBy", "Sort By", "ترتيب حسب", language)}</Label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">{t("date", "Date", "التاريخ", language)}</SelectItem>
              <SelectItem value="amount">{t("amount", "Amount", "المبلغ", language)}</SelectItem>
              <SelectItem value="status">{t("status", "Status", "الحالة", language)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
