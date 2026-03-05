const secureDelay = (req, res, next) => {
  const delay = Number(process.env.SECURE_DELAY) || 0;

  const originalSend = res.send.bind(res);

  res.send = (body) => {
    setTimeout(() => {
      originalSend(body);
    }, delay);
  };

  next();
};

export default secureDelay;