"use client";

type Props = {
  action: (formData: FormData) => Promise<void>;
  id: number;
  label?: string;
  confirmMessage: string;
};

/** زر حذف يطلب تأكيدًا قبل تنفيذ الإجراء على الخادم. */
export default function DeleteButton({ action, id, label = "حذف", confirmMessage }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-line px-3 py-2 text-sm text-danger transition hover:border-danger"
      >
        {label}
      </button>
    </form>
  );
}
