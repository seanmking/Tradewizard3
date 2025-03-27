/**
 * Logger utility for consistent logging throughout the application
 */

import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf((info) => {
    return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`;
  })
);

// Create transports based on environment
const transports: winston.transport[] = [
  // Console logger
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  })
];

// Only add file transports on the server side
if (typeof window === 'undefined') {
  // File logger for errors
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File logger for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exceptionHandlers: typeof window === 'undefined' ? [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
    }),
  ] : [],
});

// Add stream interface for Morgan
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
}; 