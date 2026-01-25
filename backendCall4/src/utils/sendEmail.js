// src/utils/sendEmail.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'owly.app.team@gmail.com',           // NOUVEAU EMAIL
    pass: 'byjxicqobhpxpsgr',               // NOUVEAU MOT DE PASSE D'APP
  },
  tls: { rejectUnauthorized: false }
});

const sendEmail = async (to, subject, text, html = null) => {
  console.log(`[GMAIL] Envoi à ${to}...`);

  try {
    const info = await transporter.sendMail({
      from: '"Owly App" <owly.app.team@gmail.com>',
      to,                                      // EMAIL DE L'UTILISATEUR
      subject,
      text,
      html: html || text,
    });

    console.log(`[GMAIL] SUCCÈS ! Envoyé à ${to} | ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[GMAIL] ÉCHEC : ${error.message}`);
    throw error;
  }
};

export default sendEmail;