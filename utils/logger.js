const winston = require('winston');

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'survey-creator.log' })
  ],
  exceptionHandlers: [
    new (winston.transports.File)({ filename: 'survey-creator.log' })
  ]
});

module.exports = logger;