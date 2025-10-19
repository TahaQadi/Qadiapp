
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  language?: 'en' | 'ar';
  showItemsPerPage?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  language = 'en',
  showItemsPerPage = true,
}: PaginationControlsProps) {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {language === 'ar'
            ? `عرض ${startIndex}-${endIndex} من ${totalItems}`
            : `Showing ${startIndex}-${endIndex} of ${totalItems}`}
        </div>

        {showItemsPerPage && onItemsPerPageChange && (
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / {language === 'ar' ? 'صفحة' : 'page'}</SelectItem>
              <SelectItem value="20">20 / {language === 'ar' ? 'صفحة' : 'page'}</SelectItem>
              <SelectItem value="50">50 / {language === 'ar' ? 'صفحة' : 'page'}</SelectItem>
              <SelectItem value="100">100 / {language === 'ar' ? 'صفحة' : 'page'}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9"
        >
          <ChevronLeft className="h-4 w-4 me-1" />
          {language === 'ar' ? 'السابق' : 'Previous'}
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="min-w-[2.5rem] h-9"
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9"
        >
          {language === 'ar' ? 'التالي' : 'Next'}
          <ChevronRight className="h-4 w-4 ms-1" />
        </Button>
      </div>
    </div>
  );
}
