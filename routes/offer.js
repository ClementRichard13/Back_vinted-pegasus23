const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.get("/offers", async (req, res) => {
  try {
    const limit = 5;
    let skip = 0;
    if (req.query.sort) {
      if (req.query.sort !== "price-asc" && req.query.sort !== "price-desc") {
        return res.status(400).json({ message: "Invalid sort query" });
      }
    }

    // console.log(req.query); // { title: 'pantalon', priceMax: '40', priceMin: '20' }
    const filters = {};
    // si j'ai une query title, alors dans mon objet filters je rajoute une clef product_name, et je lui assigne la valeur récupérée en query :
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gt: req.query.priceMin };
    }

    if (req.query.priceMax) {
      // a ce stade , si on a pas de query priceMin, alors l'objet filters.product_price, N'EXISTE PAS
      // par conséquent, impossible de créer une clef dedans !
      if (filters.product_price) {
        filters.product_price.$lt = req.query.priceMax;
      } else {
        filters.product_price = { $lt: req.query.priceMax };
      }
    }
    // on applique le même principe pour le sort :
    const sortedObject = {};
    if (req.query.sort) {
      const purifiedSortQuery = req.query.sort.replace("price-", "");
      sortedObject.product_price = purifiedSortQuery;
    }

    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }
    const offers = await Offer.find(filters)
      .select("product_name  product_price -_id")
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate({
      select: "account",
      path: "owner",
    });
    if (offer) {
      return res.status(200).json(offer);
    } else {
      return res
        .status(400)
        .json({ message: "Aucune offre ne correspond à cet ID" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      // const pictureToUpload = req.files.picture;
      // // On envoie une image à Cloudinary un buffer converti en base64
      // const result = await cloudinary.uploader.upload(
      //   convertToBase64(pictureToUpload)
      // );
      // const userToken = req.headers.authorization.replace("Bearer ", "");
      // const user = await User.findOne({ token: userToken });
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });
      if (req.files) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture)
        );
        newOffer.product_image = result;
      }

      console.log(newOffer);
      // sauvegardera l'offre

      await newOffer.save();
      return res.json(newOffer);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;
