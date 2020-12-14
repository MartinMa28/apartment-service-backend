import Queue from 'bull';
import { ObjectId } from 'mongodb';

const sendMailQueue = new Queue('sendMail', {
  redis: {
    host: 'redis',
    port: 6379,
  },
});

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

        const user = await db.collection('user').findOne({
          _id: new ObjectId(updatedSaveRecords[i]['userId']),
        });
        const message = {
          from: process.env.GMAIL_USERNAME,
          to: user.email,
          subject: 'One of your following house gets cheaper',
          text: `new price is ${updatedPrice}`,
          html: `<h1>Cheaper house for $${updatedPrice}</h1>`,
        };

        await sendMailQueue.add(message);

        for (let j = 0; j < clients.length; j++) {
          if (clients[j].userId === updatedSaveRecords[i]['userId']) {
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
