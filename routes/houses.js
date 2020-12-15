import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/by_id/:houseId', async (req, res) => {
  try {
    const { houseId } = req.params;

    const house = await req.app.locals.db
      .collection('apartment')
      .findOne({ _id: new ObjectId(houseId) });

    res.status(200).json({
      house: house,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

router.post('/update_price/:houseId/:price', async (req, res) => {
  try {
    const { houseId, price } = req.params;

    const filter = {
      _id: new ObjectId(houseId),
    };

    const updateDoc = {
      $set: {
        'result-price': parseInt(price),
      },
    };

    await req.app.locals.db
      .collection('apartment')
      .updateOne(filter, updateDoc);

    res.status(200).json({
      message: 'Updated the rent',
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rooms, minPrice, maxPrice, minArea, maxArea, page } = req.query;

    const pageSize = 24;
    let query;

    if (minArea && maxArea) {
      query = {
        bedrooms: parseInt(rooms),
        'result-price': { $gt: parseInt(minPrice), $lt: parseInt(maxPrice) },
        area: { $gt: parseInt(minArea), $lt: parseInt(maxArea) },
      };
    } else {
      query = {
        bedrooms: parseInt(rooms),
        'result-price': { $gt: parseInt(minPrice), $lt: parseInt(maxPrice) },
      };
    }

    const cursor = req.app.locals.db
      .collection('apartment')
      .find(query)
      .sort({ _id: 1 })
      .skip((parseInt(page) - 1) * pageSize)
      .limit(pageSize);

    const apartments = await cursor.toArray();

    const countCursor = req.app.locals.db.collection('apartment').find(query);
    const apartmentCount = await countCursor.count();

    res.status(200).json({
      count: apartmentCount,
      pages: Math.ceil(apartmentCount / pageSize),
      apartments: apartments,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

export default router;
