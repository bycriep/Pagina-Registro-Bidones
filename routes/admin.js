const express = require("express");
const router = express.Router();
const { protegerRuta } = require("../middlewares/authMiddleware");

router.get("/", protegerRuta, (req, res) => {
    if (req.user.rol !== "admin") {
        return res.status(403).send("Acceso denegado");
    }
    res.render("admin");
});

module.exports = router;
