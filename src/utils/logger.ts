// src/utils/logger.ts
// Centralized logging utility for the application

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log context interface
interface LogContext {
  component?: string;
  method?: string;
  data?: any;
}

// Format the current timestamp
const getTimestamp = (): string => {
  return new Date().toISOString();
};

// Format a log message
const formatLogMessage = (
  level: LogLevel,
  message: string,
  context?: LogContext
): string => {
  const timestamp = getTimestamp();
  const contextStr = context
    ? `[${context.component || ''}${context.method ? `::${context.method}` : ''}]`
    : '';
  
  return `${timestamp} ${level} ${contextStr} ${message}`;
};

// Main logging function
export const log = (
  level: LogLevel,
  message: string,
  context?: LogContext
): void => {
  const formattedMessage = formatLogMessage(level, message, context);
  
  // Log to console based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage, context?.data || '');
      break;
    case LogLevel.INFO:
      console.log(formattedMessage, context?.data || '');
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, context?.data || '');
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage, context?.data || '');
      break;
  }
  
  // In the future, we could add additional logging targets here
  // (e.g., send to a server, write to a file, etc.)
};

// Convenience methods for different log levels
export const debug = (message: string, context?: LogContext): void => {
  log(LogLevel.DEBUG, message, context);
};

export const info = (message: string, context?: LogContext): void => {
  log(LogLevel.INFO, message, context);
};

export const warn = (message: string, context?: LogContext): void => {
  log(LogLevel.WARN, message, context);
};

export const error = (message: string, context?: LogContext): void => {
  log(LogLevel.ERROR, message, context);
};

// Export a default logger object
export default {
  debug,
  info,
  warn,
  error,
  log,
};
