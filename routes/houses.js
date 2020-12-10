import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      rooms,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      minDate,
      maxDate,
      page,
    } = req.query;

    const pageSize = 24;
    let query;

    if (minArea && maxArea && minDate && maxDate) {
      query = {
        bedrooms: parseInt(rooms),
        'result-price': { $gt: parseInt(minPrice), $lt: parseInt(maxPrice) },
        area: { $gt: parseInt(minArea), $lt: parseInt(maxArea) },
        'result-date': { $gt: new Date(minDate), $lt: new Date(maxDate) },
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
