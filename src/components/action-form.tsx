"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

export type ActionState = { error?: string; ok?: number };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

// Forma koja prikazuje grešku sa servera i čuva unos kad akcija ne uspe.
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "",
  resetOnSuccess = true,
  onSuccess,
  extraButtons,
}: {
  action: Action;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  extraButtons?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) formRef.current?.reset();
    onSuccessRef.current?.();
  }, [state.ok, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        // Ručno pozivanje sprečava da React isprazni formu i kad akcija vrati grešku.
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {children}
      <div className="flex items-center gap-3 sm:col-span-full">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {pending ? "Čuvam…" : submitLabel}
        </button>
        {extraButtons}
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      </div>
    </form>
  );
}
