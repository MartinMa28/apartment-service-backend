import { assert } from 'console';
import fs from 'fs';
import { MongoClient } from 'mongodb';

const parsePrice = (priceStr) => {
  return parseFloat(priceStr.substring(1).replace(/,/g, ''));
};

const parseBedroomsArea = (bedroomAreaStr) => {
  const retObj = {
    bedrooms: 1,
    area: 800,
  };

  if (bedroomAreaStr === null) {
    return retObj;
  } else {
    const bedAreaSplits = bedroomAreaStr.split('-');
    const NUMERIC_REGEXP = /[-]{0,1}[\d]*[.]{0,1}[\d]+/g;

    if (bedAreaSplits.length === 2) {
      const numBedrooms = bedAreaSplits[0].match(NUMERIC_REGEXP);
      if (numBedrooms) {
        retObj['bedrooms'] = parseInt(numBedrooms[0]);
      }

      const numArea = bedAreaSplits[1].match(NUMERIC_REGEXP);
      if (numArea) {
        retObj['area'] = parseInt(numArea[0]);
      }
      return retObj;
    } else {
      assert(bedAreaSplits.length === 1);
      const numArea = bedAreaSplits[0].match(NUMERIC_REGEXP);

      if (numArea) {
        retObj['area'] = parseInt(numArea[0]);
      }
      return retObj;
    }
  }
};

const parseResultDate = (resultDate) => {
  return new Date(resultDate.split(' ')[0]);
};

const parseImageUrls = (imageUrls) => {
  if (imageUrls === null) return [];

  return imageUrls.map(
    (url) => url.substring(0, url.length - 10) + '1200x900.jpg'
  );
};

const processLocalJson = (filePath) => {
  try {
    let jsonArr = JSON.parse(fs.readFileSync(filePath));
    jsonArr = jsonArr.map((element) => {
      element['result-price'] = parsePrice(element['result-price']);
      const { bedrooms, area } = parseBedroomsArea(element['housing']);
      element['bedrooms'] = bedrooms;
      element['area'] = area;
      element['result-date'] = parseResultDate(element['result-date']);
      element['images'] = parseImageUrls(element['images']);

      return element;
    });

    return jsonArr;
  } catch (err) {
    console.log(err);
  }
};

async function insertDocs() {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27018', {
      useUnifiedTopology: true,
    });

    const db = client.db('apartment_database');
    await db.collection('apartment').deleteMany();
    console.log(
      `Deleted all of documents in apartment collection, remaining ${await db
        .collection('apartment')
        .countDocuments()}`
    );
    await db
      .collection('apartment')
      .insertMany(processLocalJson('./apts.json'));

    console.log(
      `Inserted ${await db.collection('apartment').countDocuments()} documents.`
    );
    client.close();
  } catch (err) {
    console.log(err);
  }
}

insertDocs();
