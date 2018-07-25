var winston = require("winston");
require("winston-daily-rotate-file");

let tsFormat = () => (new Date()).toLocaleTimeString();
let fs = require("fs");
let path = require("path");

// Create log directory if it does not exist
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Log file path, notice the "-" char since we are going to use daily rotate log file
const logFilePath = path.join(logDir, "-logs.log");

// Create logger with empty transports, we'll add transports later
var winstonLogger = new winston.Logger({
  exitOnError: false
});

// Detect NODE_ENV then add relevant log transport
winstonLogger.add(winston.transports.Console, {
  level: "silly", // logs everything to the console
  json: false,
  colorize: true,
  timestamp: tsFormat,
  handleExceptions: true,
  prettyPrint: true
});

// Reference:
//  * log levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
//  * for more information about log levels, check out the document at: https://github.com/winstonjs/winston
var logLevel = "info";
winstonLogger.add(winston.transports.DailyRotateFile, {
  filename: logFilePath,
  timestamp: tsFormat,
  datePattern: "yyyy-MM-dd",
  prepend: true,
  handleExceptions: true,
  json: false,
  level: logLevel,
  colorize: false,
  maxFiles: 30
});

const internalLogger = winstonLogger;

const logStream = {
  write: (text: string) => {
    internalLogger.info(text);
  }
};

class LoggerUtils {
  public static getLogger() {
    return internalLogger;
  };
};

export let logger = LoggerUtils.getLogger();