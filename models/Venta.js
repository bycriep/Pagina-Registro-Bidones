const mongoose = require("mongoose");

const VentaSchema = new mongoose.Schema({
    repartidor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cliente: { type: String, required: true },
    direccion: { type: String, required: true },
    cantidadBidones: { type: Number, required: true },
    precioTotal: { type: Number, required: true },
    metodoPago: {
        type: String,
        enum: ["Efectivo", "Transferencia", "Yape", "Plin", "Izipay", "Bim", "Gratis"],
        required: true
    },
    nombrePagador: { type: String },
    comprobantePagoUrl: { type: String },
    tieneDeuda: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Venta", VentaSchema);
