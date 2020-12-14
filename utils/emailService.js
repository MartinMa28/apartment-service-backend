import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Queue from 'bull';

dotenv.config();

const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendMailQueue = new Queue('sendMail', {
  redis: {
    host: 'redis',
    port: 6379,
  },
});

sendMailQueue.process(async (job) => {
  const message = job.data;
  delete message['userId'];

  const info = await transport.sendMail(message);
  console.log(`Sent email to ${message.to}, info: ${info.response}`);
});

sendMailQueue.on('completed', (job) => {
  console.log(`job completed. job id: ${job.id}`);
});

sendMailQueue.on('failed', (job) => {
  console.log(`job failed. job id: ${job.id}`);
});
