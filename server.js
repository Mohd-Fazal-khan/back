// server.js or app.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
import propertyRoutes from './routes/propertyRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js';
import stripe from './routes/stripe.js'
import cors from 'cors';


dotenv.config();

const app = express();


connectDB()

app.use(express.json());

app.use(cors({
  origin: 'https://front-xi-bay.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, 
}));

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes); 
app.use("/api", stripe);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
