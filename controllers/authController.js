const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "El usuario ya está registrado" });

        // Crear nuevo usuario
        user = new User({ nombre, email, password, rol });
        await user.save();

        res.status(201).json({ msg: "Usuario registrado correctamente" });
    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Usuario no encontrado" });

        // Comparar la contraseña correctamente
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ msg: "Credenciales incorrectas" });

        // Generar token de autenticación
        const token = jwt.sign(
            { id: user._id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token, user: { id: user._id, nombre: user.nombre, rol: user.rol } });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ msg: "Error en el servidor" });
    }
};
