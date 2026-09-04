"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmit({
  message,
  children,
  variant = "danger",
}: {
  message: string;
  children: React.ReactNode;
  variant?: "danger" | "outline" | "primary";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size="sm"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
