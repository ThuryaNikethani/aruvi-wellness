"use client";

import { Printer } from "lucide-react";
import { ui } from "@/components/ui/styles";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${ui.btnPrimary} print:hidden`}>
      <Printer className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
