import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'mock_user') {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '2525', 10),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // Mock transporter for development/testing
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('--- [MOCK EMAIL SENT] ---');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: ${mailOptions.text || mailOptions.html}`);
      console.log('-------------------------');
      return { messageId: 'mock-id-' + Math.random().toString(36).substring(7) };
    }
  };
}

export default transporter;
