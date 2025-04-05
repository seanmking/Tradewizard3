/**
 * Logger utility for consistent logging throughout the application
 */

import winston from 'winston';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  timestamp: boolean;
  prefix?: string;
}

class Logger {
  private winstonLogger: winston.Logger;
  private config: LogConfig;

  constructor(config?: Partial<LogConfig>) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      timestamp: true,
      prefix: process.env.LOG_PREFIX,
      ...config
    };

    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        const prefix = this.config.prefix ? `[${this.config.prefix}] ` : '';
        return `${timestamp} ${prefix}[${level.toUpperCase()}] ${message}`;
      })
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      })
    ];

    // Add file transport in Node.js environment
    if (typeof window === 'undefined') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error'
        }),
        new winston.transports.File({
          filename: 'logs/combined.log'
        })
      );
    }

    this.winstonLogger = winston.createLogger({
      level: this.config.level,
      format: logFormat,
      transports,
      exceptionHandlers: typeof window === 'undefined' ? [
        new winston.transports.File({
          filename: 'logs/exceptions.log',
        }),
      ] : []
    });
  }

  debug(message: string, ...args: any[]): void {
    this.winstonLogger.debug(this.formatMessage(message, args));
  }

  info(message: string, ...args: any[]): void {
    this.winstonLogger.info(this.formatMessage(message, args));
  }

  warn(message: string, ...args: any[]): void {
    this.winstonLogger.warn(this.formatMessage(message, args));
  }

  error(message: string | Error, ...args: any[]): void {
    const errorMessage = message instanceof Error ? message.stack || message.message : message;
    this.winstonLogger.error(this.formatMessage(errorMessage, args));
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.winstonLogger.level = level;
  }

  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  setTimestamp(enabled: boolean): void {
    this.config.timestamp = enabled;
  }

  private formatMessage(message: string, args: any[]): string {
    return args.length > 0 ? `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}` : message;
  }
}

// Export a singleton instance
export const logger = new Logger();

// Add stream interface for Morgan
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

// Helper function to safely use setImmediate with fallback to setTimeout
export const safeSetImmediate = function(callback: () => void): void {
  if (typeof setImmediate !== 'undefined') {
    setImmediate(callback);
  } else {
    setTimeout(callback, 0);
  }
}