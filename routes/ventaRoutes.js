const express = require("express");
const router = express.Router();
const { registrarVenta, obtenerVentas, obtenerEstadisticas, obtenerHistorial, exportarCSV, exportarPDF, historialAdmin, historialRepartidor } = require("../controllers/ventaController");

const { protegerRuta } = require("../middlewares/authMiddleware");

router.post("/registrar", protegerRuta, async (req, res) => {
    try {
        req.io = req.app.get("socketio");
        await registrarVenta(req, res);
    } catch (error) {
        res.status(500).json({ msg: "Error al registrar venta" });
    }
});

router.get("/", protegerRuta, obtenerVentas);
router.get("/estadisticas", protegerRuta, obtenerEstadisticas);
router.get("/historial", protegerRuta, obtenerHistorial);
router.get("/exportar/csv", protegerRuta, exportarCSV);
router.get("/exportar/pdf", protegerRuta, exportarPDF);
router.get("/historial/repartidor", protegerRuta, historialRepartidor);
router.get("/historial/admin", protegerRuta, historialAdmin);
router.get("/mis-ventas", protegerRuta, async (req, res) => {
    try {
        return await obtenerVentas(req, res); // 🔥 Asegura que se retorne correctamente
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener ventas" });
    }
});


module.exports = router;
