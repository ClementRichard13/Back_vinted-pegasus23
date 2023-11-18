require("dotenv").config();
const cors = require("cors");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Offer = require("./models/Offer");
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur l'API Vinted !");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const userRoute = require("./routes/user");
app.use(userRoute);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is on fire🔥🔥🔥🔥 ");
});
