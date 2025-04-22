document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                return Swal.fire({
                    icon: "warning",
                    title: "Campos vacíos",
                    text: "Por favor, llena todos los campos."
                });
            }

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("rol", data.user.rol);

                    Swal.fire({
                        icon: "success",
                        title: "Inicio de sesión exitoso",
                        text: "Redirigiendo...",
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'no-shadow' // Agregar la clase personalizada
                        }
                    });

                    localStorage.setItem("nombreRepartidor", data.user.nombre);

                    setTimeout(() => {
                        if (data.user.rol === "admin") {
                            window.location.href = "admin";
                        } else if (data.user.rol === "repartidor") {
                            window.location.href = "dashboard";
                        } else {
                            window.location.href = "dashboard";
                        }
                    }, 2000);

                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error al iniciar sesión",
                        text: data.msg || "Credenciales incorrectas."
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error de conexión",
                    text: "No se pudo conectar con el servidor."
                });
                console.error("Error al iniciar sesión:", error);
            }
        });
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById("nombre").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const rol = "repartidor";

            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nombre, email, password, rol }),
                });

                const data = await res.json();

                if (res.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Registro exitoso",
                        text: "Ahora puedes iniciar sesión",
                        timer: 2000,
                        showConfirmButton: false
                    });

                    setTimeout(() => {
                        window.location.href = "login";  
                    }, 2000);
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error en el registro",
                        text: data.msg
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error de conexión",
                    text: "No se pudo conectar con el servidor."
                });
                console.error("Error al registrarse:", error);
            }
        });
    }
});
