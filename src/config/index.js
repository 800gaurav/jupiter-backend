import { config } from "dotenv";

config();

export const PORT = process.env.PORT
export const MONGO_URI = process.env.MONGO_URI
export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRE = process.env.JWT_EXPIRE
export const SMTP_HOST = process.env.SMTP_HOST
export const SMTP_USER = process.env.SMTP_USER
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD
export const BCRYPTSALT = process.env.BCRYPTSALT
export const OXAPAY_MERCHANT_KEY = process.env.OXAPAY_MERCHANT_KEY