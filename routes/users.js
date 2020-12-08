import express from 'express';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const hashedPwd = await bcrypt.hash(req.body.password, 10);

    await req.app.locals.db.collection('user').insertOne({
      username: req.body.username,
      email: req.body.email,
      password: hashedPwd,
    });

    res.status(200).json({
      message: 'Registered a new user.',
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

export default router;
