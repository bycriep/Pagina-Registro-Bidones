const express = require("express");
const router = express.Router();
const repartidorController = require("../controllers/repartidorController");

// Ruta para obtener los repartidores y sus pedidos
router.get("/repartidores", repartidorController.obtenerRepartidoresConPedidos);

module.exports = router;
