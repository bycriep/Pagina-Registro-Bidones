document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login";
        return;
    }

    const nombreRepartidor = localStorage.getItem("nombreRepartidor") || 'Repartidor';
    document.getElementById('nombreRepartidor').textContent = nombreRepartidor;

    
    const logoutBtn = document.getElementById("logout");
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        window.location.href = "login";
    });

    const formVenta = document.getElementById("formVenta");

    if (!formVenta.dataset.listener) { // 💡 Evita agregar múltiples eventos
        formVenta.addEventListener("submit", async (e) => {
            e.preventDefault();
        
            const submitBtn = document.getElementById("submitBtn");
            submitBtn.disabled = true; // 🔒 Bloquear botón
        
            const cliente = document.getElementById("cliente").value;
            const direccion = document.getElementById("direccion").value;
            const cantidadBidones = document.getElementById("cantidadBidones").value;
            const precioTotal = document.getElementById("precioTotal").value;
            const metodoPago = document.getElementById("metodoPago").value;
            
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/ventas/registrar", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "x-auth-token": token
                    },
                    body: JSON.stringify({ cliente, direccion, cantidadBidones, precioTotal, metodoPago })
                });
        
                const data = await res.json();
                if (res.ok) {
                    Swal.fire({ icon: "success", title: "Venta registrada con éxito" });
                    document.getElementById("formVenta").reset();
                    cargarHistorial(); 
                } else {
                    Swal.fire({ icon: "error", title: "Error", text: data.msg });
                }
            } catch (error) {
                Swal.fire({ icon: "error", title: "Error de conexión", text: "No se pudo conectar con el servidor" });
                console.error("Error:", error);
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false; // 🔓 Habilitar después de 1.5s
                }, 1500);
            }
        });
        formVenta.dataset.listener = "true"; // 🔥 Marcar que ya tiene un evento
    };
    

    async function cargarHistorial() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/ventas/mis-ventas", {
                method: "GET",
                headers: { "x-auth-token": token }
            });
    
            const data = await res.json();
            if (res.ok) {
                const historialVentas = document.getElementById("historialVentas");
                
                historialVentas.innerHTML = ""; // ✅ Limpiar antes de agregar nuevas filas
    
                historialVentas.innerHTML = data.ventas.map(venta => `
                    <tr>
                        <td>${venta.cliente}</td>
                        <td>${venta.direccion}</td>
                        <td>${venta.cantidadBidones}</td>
                        <td>$${venta.precioTotal}</td>
                        <td>${new Date(venta.fecha).toLocaleDateString()}</td>
                    </tr>
                `).join("");
            } else {
                alert(data.msg);
            }
        } catch (error) {
            console.error("Error al cargar historial:", error);
        }
    }
    
    cargarHistorial();
});
