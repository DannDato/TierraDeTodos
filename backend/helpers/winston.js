import winston from "winston";
import chalk from "chalk";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";

const logDir = "logs";

// crear carpeta logs si no existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: "info",
  transports: [
    // consola
    new winston.transports.Console({
      format: winston.format.printf(({ level, message, username, ip }) => {
        const levelStyled =
          level === 'error'  ? chalk.bold.red(level.toUpperCase()) :
          level === 'warn'   ? chalk.bold.yellow(level.toUpperCase()) :
          level === 'info'   ? chalk.bold.green(level.toUpperCase()) :
          level === 'debug'  ? chalk.bold.blue(level.toUpperCase()) :
          level === 'trace'  ? chalk.bold.magenta(level.toUpperCase()) :
          level === 'fatal'  ? chalk.bold.bgRed.white(level.toUpperCase()) :
          level === 'success'? chalk.bold.cyan(level.toUpperCase()) :
          chalk.bold.gray(level.toUpperCase());
        
        const messageStyled = chalk.gray(message);
        const ipStyled = chalk.blue(ip || 'N/A');
        return `[${levelStyled}] [${ipStyled}] ${messageStyled}`;
      })
    }),

    // logs generales
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.json()
    }),

    // logs de error
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format: winston.format.json()
    })

  ]
});

export default logger;