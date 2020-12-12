import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/add/:apartmentId', async (req, res) => {
  const { apartmentId } = req.params;
  const userId = req.user._id.toString();

  try {
    const apartment = await req.app.locals.db.collection('apartment').findOne({
      _id: new ObjectId(apartmentId),
    });

    if (apartment) {
      await req.app.locals.db.collection('save_subs').insertOne({
        apartmentId: apartmentId,
        userId: userId,
        savedPrice: apartment['result-price'],
      });
    }

    res.status(200).json({
      message: 'Add a new watch',
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

router.get('/check/:apartmentId', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(200).json({
      saved: false,
      savedWatchId: null,
    });
  } else {
    const { apartmentId } = req.params;
    const userId = req.user._id.toString();
    const query = {
      apartmentId: apartmentId,
      userId: userId,
    };

    try {
      const savedWatch = await req.app.locals.db
        .collection('save_subs')
        .findOne(query);
      if (savedWatch) {
        res.status(200).json({
          saved: true,
          savedWatchId: savedWatch._id.toString(),
        });
      } else {
        res.status(200).json({
          saved: false,
          savedWatchId: null,
        });
      }
    } catch (err) {
      res.status(500).json({
        message: `Internal error: ${err}`,
      });
    }
  }
});

router.get('/delete/:apartmentId', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(200).json({
      message: 'Unauthorized user cannot un-save',
    });
  } else {
    const { apartmentId } = req.params;
    const userId = req.user._id.toString();

    try {
      await req.app.locals.db.collection('save_subs').deleteOne({
        apartmentId: apartmentId,
        userId: userId,
      });

      res.status(200).json({
        message: 'Un-watched',
      });
    } catch (err) {
      res.status(500).json({
        message: `Internal error: ${err}`,
      });
    }
  }
});

export default router;
