const Pedido = require("../models/Pedido");

// Crear un nuevo pedido
exports.crearPedido = async (req, res) => {
    try {
        const nuevoPedido = new Pedido(req.body);
        await nuevoPedido.save();
        res.status(201).json({ mensaje: "Pedido creado correctamente", pedido: nuevoPedido });
    } catch (error) {
        res.status(500).json({ error: "Error al crear el pedido", detalles: error.message });
    }
};

// Obtener todos los pedidos
exports.obtenerPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.find().populate("repartidor", "nombre email");
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener pedidos", detalles: error.message });
    }
};

// Obtener un pedido por ID
exports.obtenerPedidoPorId = async (req, res) => {
    try {
        const pedido = await Pedido.findById(req.params.id).populate("repartidor", "nombre email");
        if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el pedido", detalles: error.message });
    }
};

// Actualizar un pedido
exports.actualizarPedido = async (req, res) => {
    try {
        const pedidoActualizado = await Pedido.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pedidoActualizado) return res.status(404).json({ error: "Pedido no encontrado" });
        res.json({ mensaje: "Pedido actualizado correctamente", pedido: pedidoActualizado });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el pedido", detalles: error.message });
    }
};

// Eliminar un pedido
exports.eliminarPedido = async (req, res) => {
    try {
        const pedidoEliminado = await Pedido.findByIdAndDelete(req.params.id);
        if (!pedidoEliminado) return res.status(404).json({ error: "Pedido no encontrado" });
        res.json({ mensaje: "Pedido eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el pedido", detalles: error.message });
    }
};

// Exportar pedidos cada quincena con sumatoria
exports.exportarPedidosQuincenales = async (req, res) => {
    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(1); // Primer día del mes
        const fechaFin = new Date();
        fechaFin.setDate(15); // Día 15 del mes actual

        const pedidosQuincena = await Pedido.find({
            fechaPedido: { $gte: fechaInicio, $lte: fechaFin }
        });

        const totalPedidos = pedidosQuincena.length;
        const totalBidones = pedidosQuincena.reduce((acc, pedido) => acc + pedido.cantidadBidones, 0);
        const totalIngresos = pedidosQuincena.reduce((acc, pedido) => acc + pedido.precioTotal, 0);

        res.json({
            totalPedidos,
            totalBidones,
            totalIngresos,
            pedidos: pedidosQuincena
        });
    } catch (error) {
        res.status(500).json({ error: "Error al exportar pedidos", detalles: error.message });
    }
};
