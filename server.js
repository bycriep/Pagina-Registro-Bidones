require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const repartidorRoutes = require('./routes/repartidor');

const app = express();
connectDB(); 

app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

// Almacenar `io` en la app para acceder en las rutas
app.set("socketio", io);

io.on("connection", (socket) => {
    console.log("🔗 Cliente conectado:", socket.id);
    socket.on("disconnect", () => console.log("❌ Cliente desconectado"));
});

// Middlewares
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


// Cargar rutas
const authRoutes = require("./routes/authRoutes");
const ventaRoutes = require("./routes/ventaRoutes");

app.use("/api/auth", authRoutes);   
app.use("/api/ventas", ventaRoutes);
app.use('/api', repartidorRoutes);


// Rutas estáticas
app.get("/", (req, res) => res.sendFile(__dirname + "/public/views/index.html"));
app.get("/register", (req, res) => res.sendFile(__dirname + "/public/views/register.html"));
app.get("/login", (req, res) => res.sendFile(__dirname + "/public/views/login.html"));
app.get("/dashboard", (req, res) => res.sendFile(__dirname + "/public/views/dashboard.html"));
app.get("/admin", (req, res) => res.sendFile(__dirname + "/public/views/admin.html"));

// Mostrar rutas en consola
console.log("✅ Rutas cargadas:");
console.log("- /api/auth/register (POST)");
console.log("- /api/auth/login (POST)");
console.log("- /api/ventas (varias rutas)");
console.log("- /register (GET)");
console.log("- /login (GET)");
console.log("- /dashboard (GET)");
console.log("- /admin (GET)");

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
