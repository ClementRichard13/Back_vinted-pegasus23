const express = require("express");
const router = express.Router();
// const Offer = require("../models/Offer");
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha56");
const encBase64 = require("crypto-js/enc-base64");

router.post("/user/signup", async (req, res) => {
  try {
    const UserAlreadyExist = await User.findOne({ email: req.body.email });
    if (UserAlreadyExist !== null) {
      return res
        .status(400)
        .json({ error: { message: "L'utilisateur éxiste déjà" } });
    }

    if (req.body.username === "") {
      return res
        .status(400)
        .json({ error: { message: "Veuillez indiquer le nom d'utilisateur" } });
    }

    const password = req.body.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: Object, // nous verrons plus tard comment uploader une image
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newUser.save();
    res.json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const receivedMail = req.body.email;
    const receivedPassword = req.body.password;
    const userFound = await User.findOne({ email: receivedMail });
    const newHash = SHA256(receivedPassword + userFound.salt).toString(
      encBase64
    );

    if (newHash === userFound.hash) {
      res.json({
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      });
    } else {
      res.status(401).json({ error: { message: "Accès refusé" } });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
