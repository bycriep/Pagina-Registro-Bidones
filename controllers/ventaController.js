const Venta = require("../models/Venta");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

exports.registrarVenta = async (req, res) => {
    try {
        console.log("📌 Venta recibida:", req.body);

        const { cliente, direccion, cantidadBidones, precioTotal, metodoPago, nombrePagador, comprobantePagoUrl, tieneDeuda } = req.body;
        const repartidor = req.user.id;

        if (!cliente || !direccion || !cantidadBidones || !precioTotal || !metodoPago) {
            return res.status(400).json({ msg: "Todos los campos son obligatorios" });
        }

        const metodosValidos = ["Efectivo", "Transferencia", "Yape", "Plin", "Izipay", "Bim", "Gratis"];
        if (!metodosValidos.includes(metodoPago)) {
            return res.status(400).json({ msg: "Método de pago no válido" });
        }

        const nuevaVenta = new Venta({
            repartidor,
            cliente,
            direccion,
            cantidadBidones,
            precioTotal,
            metodoPago,
            nombrePagador,
            comprobantePagoUrl,
            tieneDeuda
        });
        

        await nuevaVenta.save();
        console.log("✅ Venta guardada correctamente:", nuevaVenta);

        return res.status(201).json({ msg: "Venta registrada correctamente", venta: nuevaVenta });

    } catch (error) {
        console.error("❌ Error al registrar venta:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.obtenerVentas = async (req, res) => {
    try {
        let ventas = req.user.rol === "admin"
            ? await Venta.find().populate("repartidor", "nombre email")
            : await Venta.find({ repartidor: req.user.id }).populate("repartidor", "nombre email");

        res.json({ ventas });
    } catch (error) {
        console.error("❌ Error al obtener ventas:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.obtenerEstadisticas = async (req, res) => {
    try {
        const ventas = await Venta.find();
        const totalVentas = ventas.length;
        const totalBidones = ventas.reduce((acc, venta) => acc + venta.cantidadBidones, 0);
        const ingresosTotales = ventas.reduce((acc, venta) => acc + venta.precioTotal, 0);

        res.json({ totalVentas, totalBidones, ingresosTotales });
    } catch (error) {
        console.error("❌ Error al obtener estadísticas:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.obtenerHistorial = async (req, res) => {
    try {
        const { fecha, repartidor, quincena } = req.query;
        let filtro = {};

        // Filtro por fecha
        if (fecha) {
            const hoy = new Date();
            if (fecha === "dia") {
                const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
                filtro.fecha = { $gte: inicioDia };
            } else if (fecha === "mes") {
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                filtro.fecha = { $gte: inicioMes };
            }
        }

        // Filtro por quincena
        if (quincena === "1" || quincena === "2") {
            const ahora = new Date();
            const anio = ahora.getFullYear();
            const mes = ahora.getMonth();

            let inicio, fin;

            if (quincena === "1") {
                // Primera quincena (1 al 15)
                inicio = new Date(anio, mes, 1);
                fin = new Date(anio, mes, 15, 23, 59, 59);
            } else if (quincena === "2") {
                // Segunda quincena (16 hasta el fin del mes)
                inicio = new Date(anio, mes, 16);
                fin = new Date(anio, mes + 1, 0, 23, 59, 59); // Fin del mes actual
            }

            filtro.fecha = { $gte: inicio, $lte: fin };
        }
        
        if (req.query.metodoPago) {
            filtro.metodoPago = req.query.metodoPago;
        }
        if (req.query.tieneDeuda) {
            filtro.tieneDeuda = req.query.tieneDeuda === "true";
        }
        

        // Filtro por repartidor
        if (repartidor) {
            filtro.repartidor = repartidor;
        }

        const ventas = await Venta.find(filtro).populate("repartidor", "nombre email");
        res.json({ ventas });
    } catch (error) {
        console.error("❌ Error al obtener historial:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.exportarCSV = async (req, res) => {
    try {
        const { fecha, repartidor, quincena, metodoPago, tieneDeuda } = req.query;
        let filtro = {};

        // Filtro por fecha
        if (fecha) {
            const hoy = new Date();
            if (fecha === "dia") {
                const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
                filtro.fecha = { $gte: inicioDia };
            } else if (fecha === "mes") {
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                filtro.fecha = { $gte: inicioMes };
            }
        }

        // Filtro por quincena
        if (quincena === "1" || quincena === "2") {
            const ahora = new Date();
            const anio = ahora.getFullYear();
            const mes = ahora.getMonth();

            let inicio, fin;

            if (quincena === "1") {
                inicio = new Date(anio, mes, 1);
                fin = new Date(anio, mes, 15, 23, 59, 59);
            } else {
                inicio = new Date(anio, mes, 16);
                fin = new Date(anio, mes + 1, 0, 23, 59, 59);
            }

            filtro.fecha = { $gte: inicio, $lte: fin };
        }

        if (repartidor) filtro.repartidor = repartidor;
        if (metodoPago) filtro.metodoPago = metodoPago;
        if (tieneDeuda) filtro.tieneDeuda = tieneDeuda === "true";

        const ventas = await Venta.find(filtro).populate("repartidor", "nombre email");

        const ventasFormateadas = ventas.map((venta) => ({
            cliente: venta.cliente,
            direccion: venta.direccion,
            cantidadBidones: venta.cantidadBidones,
            precioTotal: venta.precioTotal,
            metodoPago: venta.metodoPago,
            nombrePagador: venta.nombrePagador || "N/A",
            tieneDeuda: venta.tieneDeuda ? "Sí" : "No",
            comprobantePagoUrl: venta.comprobantePagoUrl || "N/A",
            fecha: new Date(venta.fecha).toLocaleDateString("es-ES")
        }));

        const fields = [
            "cliente",
            "direccion",
            "cantidadBidones",
            "precioTotal",
            "metodoPago",
            "nombrePagador",
            "tieneDeuda",
            "comprobantePagoUrl",
            "fecha"
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(ventasFormateadas);

        res.header("Content-Type", "text/csv");
        res.attachment("historial_ventas.csv");
        res.send(csv);
    } catch (error) {
        console.error("❌ Error al exportar CSV:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.exportarPDF = async (req, res) => {
    try {
        const { fecha, repartidor, quincena, metodoPago, tieneDeuda } = req.query;
        let filtro = {};

        if (fecha) {
            const hoy = new Date();
            if (fecha === "dia") {
                const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
                filtro.fecha = { $gte: inicioDia };
            } else if (fecha === "mes") {
                const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                filtro.fecha = { $gte: inicioMes };
            }
        }

        if (quincena === "1" || quincena === "2") {
            const ahora = new Date();
            const anio = ahora.getFullYear();
            const mes = ahora.getMonth();

            let inicio, fin;

            if (quincena === "1") {
                inicio = new Date(anio, mes, 1);
                fin = new Date(anio, mes, 15, 23, 59, 59);
            } else {
                inicio = new Date(anio, mes, 16);
                fin = new Date(anio, mes + 1, 0, 23, 59, 59);
            }

            filtro.fecha = { $gte: inicio, $lte: fin };
        }

        if (repartidor) filtro.repartidor = repartidor;
        if (metodoPago) filtro.metodoPago = metodoPago;
        if (tieneDeuda) filtro.tieneDeuda = tieneDeuda === "true";

        const ventas = await Venta.find(filtro).populate("repartidor", "nombre email");

        const doc = new PDFDocument();
        res.setHeader("Content-Disposition", "attachment; filename=historial_ventas.pdf");
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);
        doc.fontSize(14).text("Historial de Ventas", { align: "center" });

        ventas.forEach((venta, index) => {
            doc.fontSize(10).text(
                `${index + 1}. Cliente: ${venta.cliente} | Repartidor: ${venta.repartidor?.nombre || "N/A"} |
Dirección: ${venta.direccion} | Bidones: ${venta.cantidadBidones} | Total: $${venta.precioTotal} |
Pago: ${venta.metodoPago} | Pagador: ${venta.nombrePagador || "N/A"} | Deuda: ${venta.tieneDeuda ? "Sí" : "No"} |
Comprobante: ${venta.comprobantePagoUrl || "N/A"} | Fecha: ${new Date(venta.fecha).toLocaleDateString("es-PE")}`,
                { lineGap: 6 }
            );
        });

        doc.end();
    } catch (error) {
        console.error("❌ Error al exportar PDF:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};


exports.historialAdmin = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, repartidorId } = req.query;
        let filtro = {};

        if (fechaInicio && fechaFin) {
            filtro.fecha = { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) };
        }

        if (repartidorId) {
            filtro.repartidor = repartidorId;
        }
        if (req.query.metodoPago) {
            filtro.metodoPago = req.query.metodoPago;
        }
        if (req.query.tieneDeuda) {
            filtro.tieneDeuda = req.query.tieneDeuda === "true";
        }
        
        

        const ventas = await Venta.find(filtro).populate("repartidor", "nombre email");
        res.json({ ventas });
    } catch (error) {
        console.error("❌ Error al obtener historial de admin:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.historialRepartidor = async (req, res) => {
    try {
        const ventas = await Venta.find({ repartidor: req.user.id }).populate("repartidor", "nombre email");
        res.json({ ventas });
    } catch (error) {
        console.error("❌ Error al obtener historial del repartidor:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};
