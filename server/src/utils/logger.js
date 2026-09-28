/**
 * Logger utility for server logging without direct console.log statements.
 * Suppressed during automated tests to avoid noisy stderr.
 */
const formatMessage = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${typeof meta === 'object' ? JSON.stringify(meta) : meta}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    if (process.env.NODE_ENV !== 'test') {
      console.info(formatMessage('info', message, meta));
    }
  },
  warn: (message, meta) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error: (message, meta) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(formatMessage('error', message, meta));
    }
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
