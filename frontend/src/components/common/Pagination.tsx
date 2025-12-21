import React from "react";
import AppButton from "./AppButton";

interface Props {
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<Props> = ({ total, page, size, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const prevDisabled = page <= 0;
  const nextDisabled = page >= totalPages - 1;

  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <AppButton variant="secondary" disabled={prevDisabled} onClick={() => onPageChange(page - 1)}>
          Previous
        </AppButton>
        <AppButton variant="secondary" disabled={nextDisabled} onClick={() => onPageChange(page + 1)}>
          Next
        </AppButton>
      </div>
    </div>
  );
};

export default Pagination;
