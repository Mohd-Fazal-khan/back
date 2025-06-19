import express from 'express';
import multer from 'multer';
import Property from '../models/Property.js';
import { storage } from '../utils/cloudinary.js';
import { authMiddleware } from '../controllers/authController.js';
import Booking from '../models/Booking.js';

const router = express.Router();
const upload = multer({ storage });

router.post(

  '/add',
  authMiddleware,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'otherImages', maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { title, description, location,propertytype, maxGuests,price } = req.body;

      const mainImgUrl = req.files.mainImage?.[0]?.path;
      const otherImgUrls = req.files.otherImages?.map((file) => file.path);

      const newProperty = new Property({
        title,
        description,
        location,
        propertytype,
        maxGuests,
        price,
        host: req.userId || 'demoUserId',
        images: [mainImgUrl, ...(otherImgUrls || [])],
      });

      await newProperty.save();
      res.status(201).json({ message: 'Property added successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error uploading property' });
    }
  }
);

router.get("/my-properties", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ host: req.userId }); // req.user.id is set by verifyToken
    res.status(200).json(properties);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

router.get('/', async (req, res) => {
  try {
    const properties = await Property.find();
    console.log('Properties found:', properties); // Add this logging
    res.json(properties);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Fetch single property by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ message: "Failed to fetch property" });
  }
});

router.delete('/del/:id',async (req,res)=>{
    try {
     const id=req.params.id;
     const result =  await Property.findByIdAndDelete(id)
     return res.send({msg:"Success"});
    } catch (error) {
     return res.send({msg:error});
    }
 });


 // GET /api/properties/available?location=Delhi&checkIn=2025-06-25&checkOut=2025-06-28&guests=3

// backend/routes/property.js

router.post('/filter', async (req, res) => {
  const { location, checkIn, checkOut, guests } = req.body;

  try {
    const query = {};

    // Filter by location (case-insensitive)
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Filter by guests
    if (guests) {
      query.maxGuests = { $gte: guests }; // assuming you store maxGuests in DB
    }

    // Optional: Filter by availability if you store booked dates
    // You must have a `bookedDates` array in your property model for this
    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      query.$or = [
        { bookedDates: { $exists: false } }, // available if no bookings
        { bookedDates: { $not: { $elemMatch: { $gte: inDate, $lte: outDate } } } } // no conflict
      ];
    }

    const filtered = await Property.find(query);
    res.json(filtered);
  } catch (error) {
    console.error("Filter error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.put(
  "/update/:id",
  authMiddleware,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "otherImages", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const propertyId = req.params.id;
      const {
        title,
        location,
        propertytype,
        maxGuests,
        price,
        description,
      } = req.body;

      const property = await Property.findById(propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });

      // Collect uploaded images
      const newImages = [];

      // Handle main image
      if (req.files.mainImage) {
        newImages.push("uploads/" + req.files.mainImage[0].filename);
      } else if (property.images.length > 0) {
        // If no new main image, keep old one
        newImages.push(property.images[0]);
      }

      // Handle other images
      if (req.files.otherImages && req.files.otherImages.length > 0) {
        req.files.otherImages.forEach((file) => {
          newImages.push("uploads/" + file.filename);
        });
      } else {
        // If no new other images, keep old ones (excluding the first which is main)
        newImages.push(...property.images.slice(1));
      }

      // Update property fields
      property.title = title;
      property.location = location;
      property.propertytype = propertytype;
      property.maxGuests = maxGuests;
      property.price = price;
      property.description = description;
      property.images = newImages;

      await property.save();

      res.status(200).json({ message: "Property updated", property });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);





// Add this route handler
// router.get('/my', authMiddleware, async (req, res) => {
//   try {
//     const properties = await Property.find({ host: req.userId });
//     res.json(properties);
//   } catch (error) {
//     console.error('Error fetching user properties:', error);
//     res.status(500).json({ message: 'Failed to fetch properties' });
//   }
// });

// router.get('/host', authMiddleware, async (req, res) => {
//   try {
//     const properties = await Property.find({ host: req.userId});
//     res.json(properties);
//   } catch (error) {
//     console.error('Error fetching host properties:', error);
//     res.status(500).json({ message: 'Failed to fetch properties' });
//   }
// });



export default router;
