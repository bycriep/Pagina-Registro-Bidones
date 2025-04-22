const mongoose = require("mongoose");

const PedidoSchema = new mongoose.Schema({
    repartidor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cliente: { type: String, required: true },
    direccion: { type: String, required: true },
    cantidadBidones: { type: Number, required: true },
    precioTotal: { type: Number, required: true },
    metodoPago: { 
        type: String, 
        enum: ["Efectivo", "Transferencia", "Yape", "Plin", "Izipay", "Bim"], 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ["Pendiente", "En Camino", "Entregado", "Cancelado"], 
        default: "Pendiente" 
    },
    fechaPedido: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pedido", PedidoSchema);
