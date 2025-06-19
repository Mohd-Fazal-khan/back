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
    console.log('Properties found:', properties); 
    res.json(properties);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


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



router.post('/filter', async (req, res) => {
  const { location, checkIn, checkOut, guests } = req.body;

  try {
    const query = {};

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }


    if (guests) {
      query.maxGuests = { $gte: guests }; 
    }

    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      query.$or = [
        { bookedDates: { $exists: false } }, 
        { bookedDates: { $not: { $elemMatch: { $gte: inDate, $lte: outDate } } } } 
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

    
      const newImages = [];

   
      if (req.files.mainImage) {
        newImages.push("uploads/" + req.files.mainImage[0].filename);
      } else if (property.images.length > 0) {
      
        newImages.push(property.images[0]);
      }

      if (req.files.otherImages && req.files.otherImages.length > 0) {
        req.files.otherImages.forEach((file) => {
          newImages.push("uploads/" + file.filename);
        });
      } else {
       
        newImages.push(...property.images.slice(1));
      }

   
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

export default router;
