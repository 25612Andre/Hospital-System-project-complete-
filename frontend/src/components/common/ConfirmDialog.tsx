import React from "react";
import AppButton from "./AppButton";
import { useI18n } from "../../i18n/I18nProvider";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({ message, onConfirm, onCancel }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg p-6 w-80">
        <p className="mb-4 text-sm text-slate-800">{message}</p>
        <div className="flex justify-end gap-2">
          <AppButton variant="secondary" onClick={onCancel}>
            {t("common.cancel")}
          </AppButton>
          <AppButton variant="primary" onClick={onConfirm}>
            {t("common.confirm")}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
