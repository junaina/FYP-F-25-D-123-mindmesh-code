import nodemailer from "nodemailer";

export const APP_URL =
  process.env.APP_URL || "http://localhost:3000";

export const INVITE_FROM_EMAIL =
  process.env.INVITE_FROM_EMAIL || "MindMesh <no-reply@mindmesh.com>";

// Create SMTP transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
