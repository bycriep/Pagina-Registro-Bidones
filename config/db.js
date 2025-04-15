const mongoose = require("mongoose");

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB conectado");
    } catch (error) {
        console.error("❌ Error al conectar MongoDB:", error);
        process.exit(1); // Detener la ejecución si hay un error crítico
    }
};

module.exports = conectarDB;
