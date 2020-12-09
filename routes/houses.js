import express from 'express';

const router = express.Router();

router.get('/simp/:page', async (req, res) => {
  try {
    const { rooms, minPrice, maxPrice } = req.query;
    const { page } = req.params;
    const pageSize = 24;
    const query = {
      bedrooms: parseInt(rooms),
      'result-price': { $gt: parseInt(minPrice), $lt: parseInt(maxPrice) },
    };

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
      apartments: apartments,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

router.get('/comp/:page', async (req, res) => {
  try {
    const {
      rooms,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      minDate,
      maxDate,
    } = req.query;
    const { page } = req.params;
    const pageSize = 24;
    const query = {
      bedrooms: parseInt(rooms),
      'result-price': { $gt: parseInt(minPrice), $lt: parseInt(maxPrice) },
      area: { $gt: parseInt(minArea), $lt: parseInt(maxArea) },
      'result-date': { $gt: new Date(minDate), $lt: new Date(maxDate) },
    };
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
      apartments: apartments,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal error: ${err}`,
    });
  }
});

export default router;
