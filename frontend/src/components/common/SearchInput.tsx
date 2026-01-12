import React from "react";
import clsx from "clsx";
import { useI18n } from "../../i18n/I18nProvider";

const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, placeholder, ...rest }) => {
  const { t } = useI18n();

  return (
    <input
      type="search"
      className={clsx(
        "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      placeholder={placeholder ?? t("common.searchPlaceholder")}
      {...rest}
    />
  );
};

export default SearchInput;
