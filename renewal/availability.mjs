export function recruitmentState(now, start, end) {
  const value = new Date(now).getTime();
  const starts = new Date(start).getTime();
  const ends = new Date(end).getTime();
  if (![value, starts, ends].every(Number.isFinite) || starts >= ends)
    return "closed";
  if (value < starts) return "upcoming";
  return value < ends ? "open" : "closed";
}
