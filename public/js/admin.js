document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "login");

    const rol = localStorage.getItem("rol");
    if (rol !== "admin") return (window.location.href = "/dashboard");

    document.getElementById("logout")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("rol");
        window.location.href = "login";
    });

    const formatearFechaCorta = fechaISO => {
        const fecha = new Date(fechaISO);
        const dia = fecha.getDate().toString().padStart(2, "0");
        const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    };

    const cargarRepartidores = async () => {
        try {
            const res = await fetch("/api/repartidores", {
                headers: { "x-auth-token": token },
            });
            if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

            const data = await res.json();
            const filtroRepartidor = document.getElementById("filtroRepartidor");
            if (filtroRepartidor) {
                filtroRepartidor.innerHTML =
                    `<option value="">Todos los repartidores</option>` +
                    data.repartidores.map(r => `<option value="${r._id}">${r.nombre}</option>`).join("");
            }

            mostrarRepartidoresConPedidos(data.repartidores);
        } catch (error) {
            console.error("❌ Error al cargar repartidores:", error.message);
        }
    };

    const mostrarRepartidoresConPedidos = repartidores => {
        const tabla = document.querySelector("#tablaRepartidores tbody");
        if (!tabla) return;
        tabla.innerHTML = repartidores.map(r => `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.pedidos.length}</td>
                <td>
                    <table class="tablaPedidos">
                        <tr>
                            <th>Cliente</th><th>Dirección</th><th>Cantidad Bidones</th><th>Precio Total</th>
                        </tr>
                        ${r.pedidos.map(p => `
                            <tr>
                                <td>${p.cliente}</td>
                                <td>${p.direccion}</td>
                                <td>${p.cantidadBidones}</td>
                                <td>$${p.precioTotal}</td>
                            </tr>
                        `).join("")}
                    </table>
                </td>
            </tr>
        `).join("");
    };

    const cargarVentasPorRepartidor = async (repartidor = "", fecha = "", quincena = 0, metodoPago = "", tieneDeuda = false) => {
        try {
            const query = new URLSearchParams({
                repartidor,
                fecha,
                quincena
            });

            if (metodoPago) query.append("metodoPago", metodoPago);
            if (tieneDeuda) query.append("tieneDeuda", "true");

            const res = await fetch(`/api/ventas/historial?${query.toString()}`, {
                headers: { "x-auth-token": token }
            });

            if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
            const data = await res.json();

            mostrarVentas(data.ventas);
            actualizarEstadisticas(data.ventas);
            inicializarGrafica(data.ventas);
        } catch (error) {
            console.error("❌ Error al cargar ventas:", error.message);
        }
    };

    const mostrarVentas = ventas => {
        const tabla = document.querySelector("#tablaVentas tbody");
        if (!tabla) return;
        tabla.innerHTML = ventas.map(v => `
            <tr>
                <td>${v.cliente}</td>
                <td>${v.repartidor ? v.repartidor.nombre : "N/A"}</td>
                <td>${v.direccion}</td>
                <td>${v.cantidadBidones}</td>
                <td>${v.precioTotal}</td>
                <td>${v.metodoPago}</td>
                <td>${v.nombrePagador || "N/A"}</td>
                <td>${v.tieneDeuda ? "Sí" : "No"}</td>
                <td>${v.comprobantePagoUrl ? `<a href="${v.comprobantePagoUrl}" target="_blank">Ver</a>` : "N/A"}</td>
                <td>${formatearFechaCorta(v.fecha)}</td>
            </tr>
        `).join("");
    };

    const actualizarEstadisticas = ventas => {
        const totalVentas = ventas.length;
        const totalBidones = ventas.reduce((sum, v) => sum + v.cantidadBidones, 0);
        const ingresos = ventas.reduce((sum, v) => sum + v.precioTotal, 0);

        document.getElementById("totalVentas").textContent = totalVentas;
        document.getElementById("totalBidones").textContent = totalBidones;
        document.getElementById("ingresosTotales").textContent = `$${ingresos.toFixed(2)}`;
    };

    const filtrarVentas = async () => {
        const fecha = document.getElementById("filtroFecha")?.value;
        const repartidor = document.getElementById("filtroRepartidor")?.value;
        const metodoPago = document.getElementById("filtroMetodoPago")?.value;
        const tieneDeuda = document.getElementById("filtroDeuda")?.checked;

        let quincenaValor = 0;
        if (fecha === "quincena1") quincenaValor = 1;
        else if (fecha === "quincena2") quincenaValor = 2;

        const fechaFiltro = (fecha === "mes" || fecha === "dia") ? fecha : "";

        await cargarVentasPorRepartidor(repartidor, fechaFiltro, quincenaValor, metodoPago, tieneDeuda);
    };

    ["filtroFecha", "filtroRepartidor", "filtroMetodoPago", "filtroDeuda"].forEach(id =>
        document.getElementById(id)?.addEventListener("change", filtrarVentas)
    );

    const exportar = async (tipo) => {
        try {
            const fecha = document.getElementById("filtroFecha")?.value;
            const repartidor = document.getElementById("filtroRepartidor")?.value;
            const metodoPago = document.getElementById("filtroMetodoPago")?.value;
            const tieneDeuda = document.getElementById("filtroDeuda")?.checked;

            let quincenaValor = 0;
            if (fecha === "quincena1") quincenaValor = 1;
            else if (fecha === "quincena2") quincenaValor = 2;

            const fechaFiltro = (fecha === "mes" || fecha === "dia") ? fecha : "";

            const query = new URLSearchParams({
                fecha: fechaFiltro,
                repartidor,
                quincena: quincenaValor
            });

            if (metodoPago) query.append("metodoPago", metodoPago);
            if (tieneDeuda) query.append("tieneDeuda", "true");

            const res = await fetch(`/api/ventas/exportar/${tipo}?${query.toString()}`, {
                headers: { "x-auth-token": token }
            });

            if (!res.ok) throw new Error("Error al exportar");

            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `historial_ventas.${tipo}`;
            link.click();
        } catch (error) {
            console.error(`❌ Error al exportar ${tipo.toUpperCase()}:`, error.message);
        }
    };

    document.getElementById("exportCSV")?.addEventListener("click", () => exportar("csv"));
    document.getElementById("exportPDF")?.addEventListener("click", () => exportar("pdf"));

    let ventasChart;
    const inicializarGrafica = ventas => {
        const ctx = document.getElementById("ventasChart").getContext("2d");
        const data = {
            labels: ["Total Ventas", "Bidones Vendidos", "Ingresos Totales"],
            datasets: [{
                data: [
                    ventas.length,
                    ventas.reduce((sum, v) => sum + v.cantidadBidones, 0),
                    ventas.reduce((sum, v) => sum + v.precioTotal, 0)
                ],
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
            }]
        };

        if (ventasChart) ventasChart.destroy();
        ventasChart = new Chart(ctx, { type: "pie", data });
    };

    await cargarRepartidores();
    await cargarVentasPorRepartidor();
});
