import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

// Reusable "are you sure?" dialog, used by all delete actions.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-1.5 text-sm text-gray-600">{message}</p>
      </div>
    </Modal>
  );
}
