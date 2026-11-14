// Shared class strings so every form and card looks and behaves the same.
export const ui = {
  card: "rounded-3xl border border-line bg-surface p-5 sm:p-6",
  label: "mb-1.5 block font-semibold text-ink",
  hint: "mt-1 text-sm text-ink-soft",
  input:
    "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink placeholder:text-ink-soft/70 focus:border-stream focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus)]",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 font-semibold text-ink hover:bg-surface-2 disabled:opacity-50",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-full border border-clay px-5 py-2.5 font-semibold text-clay hover:bg-clay-soft disabled:opacity-50",
  chip: "inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
  chipOn: "border-leaf bg-leaf-soft text-ink",
  chipOff: "border-line text-ink-soft hover:bg-surface-2",
  h1: "font-display text-3xl font-medium text-ink",
  h2: "text-lg font-semibold text-ink",
};
