const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  reset: "\x1b[0m",
  error: "\x1b[31m", // Red
  warn: "\x1b[33m", // Yellow
  info: "\x1b[36m", // Cyan
  debug: "\x1b[35m", // Magenta
};

const getLogLevel = () => {
  return levels[process.env.LOG_LEVEL] || levels.info;
};

const log = (level, message, data = "") => {
  if (levels[level] <= getLogLevel()) {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const reset = colors.reset;
    const logMessage = data ? `${message} - ${JSON.stringify(data)}` : message;
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${logMessage}`);
  }
};

const logger = {
  error: (message, data) => log("error", message, data),
  warn: (message, data) => log("warn", message, data),
  info: (message, data) => log("info", message, data),
  debug: (message, data) => log("debug", message, data),
};

export default logger;
