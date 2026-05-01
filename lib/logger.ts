export const logger = {
  log: (...args: unknown[]) =>
    process.env.NODE_ENV === 'development' && console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) =>
    process.env.NODE_ENV === 'development' && console.warn(...args),
};
