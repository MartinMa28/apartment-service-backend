import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  res.writeHead(200, headers);

  if (req.isAuthenticated()) {
    res.write(
      'data: ' +
        JSON.stringify({
          message: 'Server starts listening on price changes.',
        }) +
        '\n\n'
    );

    const newClient = {
      id: Date.now(),
      res: res,
      userId: req.user._id.toString(),
    };

    req.app.locals.clients.push(newClient);

    req.on('close', () => {
      console.log(`Connection with [user: ${newClient.userId}] closed.`);
      req.app.locals.clients = req.app.locals.clients.filter(
        (c) => c.userId != newClient.userId
      );
    });
  } else {
    res.write(`data: Unauthorized\n\n`);
  }
});

export default router;
