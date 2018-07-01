module.exports.emailSubject =
  'follow up survey';

module.exports.getEmailMessage = followUpUrl => {
  return (
    `Please follow the link to the next survey: ${followUpUrl} .`
  );
};


module.exports.emailIdempotentList = [];
