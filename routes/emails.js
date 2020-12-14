import express from 'express';
import Queue from 'bull';
import { ObjectId } from 'mongodb';

const sendMailQueue = new Queue('sendMail', {
  redis: {
    host: 'redis',
    port: 6379,
  },
});

const router = express.Router();

router.post('/:apartmentId', async (req, res) => {
  const { apartmentId } = req.params;

  try {
    const apartment = await req.app.locals.db.collection('apartment').findOne({
      _id: new ObjectId(apartmentId),
    });

    if (req.body.toPoster === true) {
      const message = {
        from: process.env.GMAIL_USERNAME,
        to: process.env.DUMMY_POSTER_EMAIL_ADDR,
        subject: apartment['result-title'],
        text: `${apartment['result-title']} - $${apartment['result-price']}/month`,
        html: apartment['postingbody'],
      };

      await sendMailQueue.add(message);
      res.status(200).json({
        message: 'Sent (poster) message to the email queue.',
      });
    } else {
      const message = {
        from: process.env.GMAIL_USERNAME,
        to: req.user.email,
        subject: apartment['result-title'],
        text: `${apartment['result-title']} - $${apartment['result-price']}/month`,
        html: apartment['postingbody'],
        userId: req.user._id,
      };

      await sendMailQueue.add(message);
      res.status(200).json({
        message: 'Sent (user) message to the email queue',
      });
    }
  } catch (err) {
    console.log(`Internal error in email route: ${err}`);
    res.status(500).json({
      message: 'Failed to send the email.',
    });
  }
});

export default router;
