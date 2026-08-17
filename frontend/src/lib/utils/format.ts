const dateTimeFormatter = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  return dateTimeFormatter.format(new Date(value));
}
