export const toIsoString = (value: Date | string | null) => {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};
