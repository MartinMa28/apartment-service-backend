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
  updatedPrice,
  clients
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

        for (let j = 0; j < clients.length; j++) {
          if (clients[j].userId === updatedSaveRecords[i]['userId']) {
            console.log('Inside if statement' + clients[j].userId);
            clients[j].res.write(
              'data: ' +
                JSON.stringify({
                  message: `One of your following houses becomes cheaper! It's ${updatedPrice} right now!`,
                  apartmentId: updatedSaveRecords[i]['apartmentId'],
                }) +
                '\n\n'
            );
            break;
          }
        }
      }
      await updateSavedPrice(db, updatedSaveRecords[i]['_id'], updatedPrice);
    }
  } catch (err) {
    console.log(`Internal Error in changeStream events: ${err}`);
  }
};

export default findAndNotifySavedUsers;
