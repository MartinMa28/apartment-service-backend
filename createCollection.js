import { assert } from 'console';
import fs from 'fs';

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

const processLocalJson = async (filePath) => {
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
    console.log(jsonArr.slice(10));
  } catch (err) {
    console.log(err);
  }
};

processLocalJson('./apts.json');
