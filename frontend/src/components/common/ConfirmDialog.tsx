import React from "react";
import AppButton from "./AppButton";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-md shadow-lg p-6 w-80">
      <p className="mb-4 text-sm text-slate-800">{message}</p>
      <div className="flex justify-end gap-2">
        <AppButton variant="secondary" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton variant="primary" onClick={onConfirm}>
          Confirm
        </AppButton>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
