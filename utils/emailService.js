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

const mailNotificationQueue = new Queue('mailNotification', {
  redis: {
    host: 'redis',
    port: 6379,
  },
});

sendMailQueue.process(async (job) => {
  const emailMessage = job.data;

  const info = await transport.sendMail(emailMessage);
  console.log(`Sent email to ${emailMessage.to}, info: ${info.response}`);
});

sendMailQueue.on('completed', async (job) => {
  console.log(`job completed. job id: ${job.id}`);
  let message;
  if (job.data.toPoster === true) {
    message = {
      userId: job.data.userId,
      message: 'Email has been sent to the poster.',
    };
  } else if (job.data.houseDetail === true) {
    message = {
      userId: job.data.userId,
      message: 'Email has been sent to you.',
    };
  }
  await mailNotificationQueue.add(message);
});

sendMailQueue.on('failed', async (job) => {
  console.log(`job failed. job id: ${job.id}`);
  const message = {
    userId: job.data.userId,
    message: `Failed to email.`,
  };
  await mailNotificationQueue.add(message);
});
