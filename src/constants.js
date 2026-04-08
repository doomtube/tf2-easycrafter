const LogLevel = Object.freeze({
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    DEBUG: 'debug',
    DONE: 'done'
});

const LogColors = {
    [LogLevel.INFO]:    '\x1b[36m', // Cyan
    [LogLevel.WARN]:    '\x1b[33m', // Yellow
    [LogLevel.ERROR]:   '\x1b[31m', // Red
    [LogLevel.DONE]:    '\x1b[32m', // Green
    [LogLevel.DEBUG]:   '\x1b[90m', // Gray
    DIM:                '\x1b[2m',
    RESET:              '\x1b[0m'
};

module.exports = { LogLevel, LogColors }
