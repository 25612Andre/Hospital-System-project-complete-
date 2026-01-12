import React from "react";
import AppButton from "./AppButton";
import { useI18n } from "../../i18n/I18nProvider";

interface Props {
  total: number;
  page: number;
  size: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<Props> = ({ total, page, size, onPageChange }) => {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / size));
  const prevDisabled = page <= 0;
  const nextDisabled = page >= totalPages - 1;

  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        {t("pagination.pageOf", { page: page + 1, total: totalPages })}
      </span>
      <div className="flex gap-2">
        <AppButton variant="secondary" disabled={prevDisabled} onClick={() => onPageChange(page - 1)}>
          {t("pagination.previous")}
        </AppButton>
        <AppButton variant="secondary" disabled={nextDisabled} onClick={() => onPageChange(page + 1)}>
          {t("pagination.next")}
        </AppButton>
      </div>
    </div>
  );
};

export default Pagination;
