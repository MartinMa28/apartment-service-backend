const updateSavedPrice = async (db, saveRecordIdObject, updatedPrice) => {
  const filter = {
    _id: saveRecordIdObject,
  };

  const updateDoc = {
    $set: {
      savedPrice: updatedPrice,
    },
  };

  await db.collection('save_subs').updateOne(filter, updateDoc);
};

const findAndNotifySavedUsers = async (
  db,
  updatedApartmentId,
  updatedPrice
) => {
  const query = {
    apartmentId: updatedApartmentId,
  };

  try {
    const cursor = await db.collection('save_subs').find(query);
    const updatedSaveRecords = await cursor.toArray();

    for (let i = 0; i < updatedSaveRecords.length; i++) {
      if (updatedSaveRecords[i]['savedPrice'] > updatedPrice) {
        console.log(
          `should notify [user: ${updatedSaveRecords[i]['userId']}] over here, new price is: ${updatedPrice}`
        );
      }
      await updateSavedPrice(db, updatedSaveRecords[i]['_id'], updatedPrice);
    }
  } catch (err) {
    console.log(`Internal Error in changeStream events: ${err}`);
  }
};

export default findAndNotifySavedUsers;
