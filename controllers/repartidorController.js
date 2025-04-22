const Repartidor = require('../models/User');  // Asegúrate de importar el modelo de 'User'
const Venta = require('../models/Venta');    // Modelo de 'Venta'

const obtenerRepartidoresConPedidos = async (req, res) => {
    try {
        // Usar aggregate para hacer el lookup entre Repartidores y Ventas
        const repartidores = await Repartidor.aggregate([
            {
                $match: { rol: "repartidor" }  // Filtramos solo los repartidores
            },
            {
                $lookup: {
                    from: 'ventas', // La colección que vamos a relacionar (ventas)
                    localField: '_id', // Campo de la colección 'repartidores' (referencia)
                    foreignField: 'repartidor', // Campo en 'ventas' que referencia al repartidor
                    as: 'pedidos'  // El nombre del array resultante
                }
            },
            {
                $project: {  // Filtramos los campos que queremos retornar
                    nombre: 1,
                    pedidos: 1  // Incluir los pedidos relacionados
                }
            }
        ]);

        // Si no encontramos repartidores, retornamos un array vacío
        if (!repartidores || repartidores.length === 0) {
            return res.json({ repartidores: [] });
        }

        // Respondemos con los repartidores y sus pedidos
        res.json({ repartidores });
    } catch (error) {
        console.error("Error al obtener los repartidores:", error);
        res.status(500).json({ msg: "Error al obtener los repartidores y pedidos" });
    }
};

module.exports = { obtenerRepartidoresConPedidos };
