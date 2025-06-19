import express from 'express';
import { authMiddleware } from '../controllers/authController.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { property, checkIn, checkOut, guests, totalPrice } = req.body;

    if (!property || !checkIn || !checkOut || !guests || !totalPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

      const overlappingBooking = await Booking.findOne({
      property,
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: "Property already booked for selected dates." });
    }

    const newBooking = new Booking({
      user: req.userId,
      property,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error("Booking creation error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/check-availability", async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut } = req.body;

    const overlappingBooking = await Booking.findOne({
      property: propertyId,
      $or: [
        {
          checkIn: { $lt: new Date(checkOut) },
          checkOut: { $gt: new Date(checkIn) },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(200).json({ available: false });
    }

    res.status(200).json({ available: true });
  } catch (err) {
    console.error("Availability check failed", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



export default router;