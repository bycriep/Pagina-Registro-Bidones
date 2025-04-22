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

    if (!formVenta.dataset.listener) {
        formVenta.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById("submitBtn");
            submitBtn.disabled = true;

            const cliente = document.getElementById("cliente").value;
            const direccion = document.getElementById("direccion").value;
            const cantidadBidones = document.getElementById("cantidadBidones").value;
            const precioTotal = document.getElementById("precioTotal").value;
            const metodoPago = document.getElementById("metodoPago").value;
            const nombrePagador = document.getElementById("nombrePagador").value;
            const tieneDeuda = document.getElementById("tieneDeuda").checked;

            let comprobantePagoUrl = "";
            const fileInput = document.getElementById("comprobantePagoFile");

            try {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "preset_publico"); // ✅ Tu preset en Cloudinary

                    const resCloud = await fetch("https://api.cloudinary.com/v1_1/dtxbnpyna/image/upload", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await resCloud.json();
                    console.log("📤 Respuesta de Cloudinary:", data);

                    if (!data.secure_url) {
                        throw new Error("Error al subir imagen a Cloudinary");
                    }

                    comprobantePagoUrl = data.secure_url;
                }

                const res = await fetch("/api/ventas/registrar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-auth-token": token
                    },
                    body: JSON.stringify({
                        cliente,
                        direccion,
                        cantidadBidones,
                        precioTotal,
                        metodoPago,
                        nombrePagador,
                        comprobantePagoUrl,
                        tieneDeuda
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    Swal.fire({ icon: "success", title: "Venta registrada con éxito" });
                    formVenta.reset();
                    cargarHistorial();
                } else {
                    Swal.fire({ icon: "error", title: "Error", text: data.msg });
                }
            } catch (error) {
                Swal.fire({ icon: "error", title: "Error al subir comprobante", text: error.message });
                console.error("❌ Error al subir o registrar venta:", error);
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 1500);
            }
        });

        formVenta.dataset.listener = "true";
    }

    async function cargarHistorial() {
        try {
            const res = await fetch("/api/ventas/mis-ventas", {
                method: "GET",
                headers: { "x-auth-token": token }
            });

            const data = await res.json();
            if (res.ok) {
                const historialVentas = document.getElementById("historialVentas");
                historialVentas.innerHTML = data.ventas.map(venta => `
                    <tr>
                        <td>${venta.cliente}</td>
                        <td>${venta.direccion}</td>
                        <td>${venta.cantidadBidones}</td>
                        <td>$${venta.precioTotal}</td>
                        <td>${new Date(venta.fecha).toLocaleDateString()}</td>
                        <td>${venta.nombrePagador || "N/A"}</td>
                        <td>${venta.tieneDeuda ? "Sí" : "No"}</td>
                        <td>${venta.comprobantePagoUrl ? `<a href="${venta.comprobantePagoUrl}" target="_blank">Ver</a>` : "N/A"}</td>
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
