let citas = JSON.parse(localStorage.getItem("citas")) || [];
let editando = false;
let idCitaEditando = null;
let filtroFechaActual = "todas";

function guardarCita() {
    if (editando) {
        actualizarCita();
    } else {
        registrarCita();
    }
}

function registrarCita() {
    let cliente = document.getElementById("cliente").value.trim();
    let telefono = document.getElementById("telefono").value.trim();
    let servicio = document.getElementById("servicio").value;
    let fecha = document.getElementById("fecha").value;
    let horaInicio = document.getElementById("horaInicio").value;
    let horaFin = document.getElementById("horaFin").value;
    let precio = document.getElementById("precio").value;
    let estado = document.getElementById("estado").value;

    if (cliente === "" || telefono === "" || servicio === "" || fecha === "" || horaInicio === "" || horaFin === "" || precio === "") {
        alert("Por favor complete todos los campos.");
        return;
    }

    if (horaFin <= horaInicio) {
        alert("La hora fin del servicio debe ser mayor que la hora de inicio.");
        return;
    }

    if (Number(precio) <= 0) {
        alert("El valor del servicio debe ser mayor que cero.");
        return;
    }

    let cruceHorario = citas.some(cita => {
        return cita.fecha === fecha &&
               cita.estado !== "Cancelada" &&
               cita.estado !== "Terminada" &&
               (
                    (horaInicio >= cita.horaInicio && horaInicio < cita.horaFin) ||
                    (horaFin > cita.horaInicio && horaFin <= cita.horaFin) ||
                    (horaInicio <= cita.horaInicio && horaFin >= cita.horaFin)
               );
    });

    if (cruceHorario) {
        alert("Ya existe una cita en ese rango de horario. Por favor selecciona otra hora.");
        return;
    }

    let cita = {
        id: Date.now(),
        cliente,
        telefono,
        servicio,
        fecha,
        horaInicio,
        horaFin,
        precio: Number(precio),
        estado,
        recordatorioEnviado: false
    };

    citas.push(cita);
    guardarDatos();

    limpiarFormulario();
    mostrarCitas();

    alert("Cita registrada correctamente.");
}

function editarCita(index) {
    let cita = citas[index];

    document.getElementById("cliente").value = cita.cliente;
    document.getElementById("telefono").value = cita.telefono;
    document.getElementById("servicio").value = cita.servicio;
    document.getElementById("fecha").value = cita.fecha;
    document.getElementById("horaInicio").value = cita.horaInicio;
    document.getElementById("horaFin").value = cita.horaFin;
    document.getElementById("precio").value = cita.precio;
    document.getElementById("estado").value = cita.estado;

    editando = true;
    idCitaEditando = cita.id;

    document.getElementById("tituloFormulario").textContent = "Editar cita";
    document.getElementById("btnGuardar").textContent = "Actualizar cita";
    document.getElementById("btnCancelar").style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function actualizarCita() {
    let cliente = document.getElementById("cliente").value.trim();
    let telefono = document.getElementById("telefono").value.trim();
    let servicio = document.getElementById("servicio").value;
    let fecha = document.getElementById("fecha").value;
    let horaInicio = document.getElementById("horaInicio").value;
    let horaFin = document.getElementById("horaFin").value;
    let precio = document.getElementById("precio").value;
    let estado = document.getElementById("estado").value;

    if (cliente === "" || telefono === "" || servicio === "" || fecha === "" || horaInicio === "" || horaFin === "" || precio === "") {
        alert("Por favor complete todos los campos.");
        return;
    }

    if (horaFin <= horaInicio) {
        alert("La hora fin del servicio debe ser mayor que la hora de inicio.");
        return;
    }

    if (Number(precio) <= 0) {
        alert("El valor del servicio debe ser mayor que cero.");
        return;
    }

    let cruceHorario = citas.some(cita => {
        return cita.id !== idCitaEditando &&
               cita.fecha === fecha &&
               cita.estado !== "Cancelada" &&
               cita.estado !== "Terminada" &&
               (
                    (horaInicio >= cita.horaInicio && horaInicio < cita.horaFin) ||
                    (horaFin > cita.horaInicio && horaFin <= cita.horaFin) ||
                    (horaInicio <= cita.horaInicio && horaFin >= cita.horaFin)
               );
    });

    if (cruceHorario) {
        alert("Ya existe otra cita en ese rango de horario. Por favor selecciona otra hora.");
        return;
    }

    citas = citas.map(cita => {
        if (cita.id === idCitaEditando) {
            return {
                id: cita.id,
                cliente,
                telefono,
                servicio,
                fecha,
                horaInicio,
                horaFin,
                precio: Number(precio),
                estado,
                recordatorioEnviado: false
            };
        }

        return cita;
    });

    guardarDatos();
    limpiarFormulario();
    cancelarEdicion();
    mostrarCitas();

    alert("Cita actualizada correctamente.");
}

function crearFechaHora(fecha, hora) {
    let partesFecha = fecha.split("-");
    let partesHora = hora.split(":");

    return new Date(
        Number(partesFecha[0]),
        Number(partesFecha[1]) - 1,
        Number(partesFecha[2]),
        Number(partesHora[0]),
        Number(partesHora[1]),
        0
    );
}

function obtenerFechaHoy() {
    let hoy = new Date();
    let anio = hoy.getFullYear();
    let mes = String(hoy.getMonth() + 1).padStart(2, "0");
    let dia = String(hoy.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function actualizarEstadosAutomaticos() {
    let ahora = new Date();
    let huboCambio = false;

    citas = citas.map(cita => {
        let fechaHoraFin = crearFechaHora(cita.fecha, cita.horaFin);

        if (
            fechaHoraFin <= ahora &&
            cita.estado !== "Cancelada" &&
            cita.estado !== "Terminada"
        ) {
            huboCambio = true;
            return { ...cita, estado: "Terminada" };
        }

        return cita;
    });

    if (huboCambio) {
        guardarDatos();
    }
}

function revisarRecordatoriosAutomaticos() {
    let ahora = new Date();
    let huboCambio = false;

    citas.forEach((cita, index) => {
        let fechaHoraInicio = crearFechaHora(cita.fecha, cita.horaInicio);
        let diferenciaMinutos = (fechaHoraInicio - ahora) / 60000;

        // 1440 minutos = 24 horas = 1 día antes
        if (
            diferenciaMinutos <= 1440 &&
            diferenciaMinutos > 0 &&
            cita.estado === "Confirmada" &&
            cita.recordatorioEnviado !== true
        ) {
            alert(`Recordatorio automático: falta 1 día o menos para la cita de ${cita.cliente}. Se abrirá WhatsApp con el mensaje listo.`);

            enviarRecordatorio(index);

            citas[index].recordatorioEnviado = true;
            huboCambio = true;
        }
    });

    if (huboCambio) {
        guardarDatos();
        mostrarCitas();
    }
}

function mostrarTextoEstado(estado) {
    if (estado === "Terminada") {
        return "Servicio terminado";
    }

    return estado;
}

function claseEstado(estado) {
    return estado;
}

function mostrarCitasHoy() {
    actualizarEstadosAutomaticos();

    let contenedor = document.getElementById("listaCitasHoy");
    let fechaHoy = obtenerFechaHoy();

    let citasHoy = citas
        .filter(cita => cita.fecha === fechaHoy && cita.estado !== "Cancelada")
        .sort((a, b) => crearFechaHora(a.fecha, a.horaInicio) - crearFechaHora(b.fecha, b.horaInicio));

    if (citasHoy.length === 0) {
        contenedor.innerHTML = `<div class="disponible">Hoy no hay citas agendadas.</div>`;
        return;
    }

    let html = `<h3>Agenda de hoy ${formatearFecha(fechaHoy)}</h3>`;

    citasHoy.forEach(cita => {
        html += `
            <div class="hoy-card">
                <p><strong>Cliente:</strong> ${cita.cliente}</p>
                <p><strong>Servicio:</strong> ${cita.servicio}</p>
                <p><strong>Horario:</strong> ${cita.horaInicio} - ${cita.horaFin}</p>
                <p><strong>Valor:</strong> $${Number(cita.precio).toLocaleString("es-CO")}</p>
                <p><strong>Estado:</strong> ${mostrarTextoEstado(cita.estado)}</p>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

function mostrarCalendario() {
    let fechaSeleccionada = document.getElementById("fechaCalendario").value;
    let resultado = document.getElementById("resultadoCalendario");

    if (fechaSeleccionada === "") {
        resultado.innerHTML = "<p>Selecciona una fecha para ver las citas agendadas.</p>";
        return;
    }

    actualizarEstadosAutomaticos();

    let citasDelDia = citas
        .filter(cita => cita.fecha === fechaSeleccionada && cita.estado !== "Cancelada")
        .sort((a, b) => crearFechaHora(a.fecha, a.horaInicio) - crearFechaHora(b.fecha, b.horaInicio));

    if (citasDelDia.length === 0) {
        resultado.innerHTML = `
            <div class="disponible">
                Día disponible. No hay citas agendadas para ${formatearFecha(fechaSeleccionada)}.
            </div>
        `;
        return;
    }

    let html = `<h3>Citas para ${formatearFecha(fechaSeleccionada)}</h3>`;

    citasDelDia.forEach(cita => {
        html += `
            <div class="ocupada">
                <strong>${cita.horaInicio} - ${cita.horaFin}</strong>
                Cliente: ${cita.cliente}<br>
                Servicio: ${cita.servicio}<br>
                Estado: ${mostrarTextoEstado(cita.estado)}
            </div>
        `;
    });

    html += `<div class="horario-libre">Los espacios que no estén dentro de estos rangos están disponibles.</div>`;

    resultado.innerHTML = html;
}

function actualizarResumenGanancias() {
    let hoy = obtenerFechaHoy();
    let ahora = new Date();

    let totalHoy = 0;
    let totalSemana = 0;
    let totalMes = 0;

    let pendientes = 0;
    let confirmadas = 0;
    let terminadas = 0;
    let canceladas = 0;

    citas.forEach(cita => {
        if (cita.estado === "Pendiente") pendientes++;
        if (cita.estado === "Confirmada") confirmadas++;
        if (cita.estado === "Terminada") terminadas++;
        if (cita.estado === "Cancelada") canceladas++;

        if (cita.estado === "Terminada") {
            let fechaCita = crearFechaHora(cita.fecha, cita.horaInicio);
            let diferenciaDias = Math.floor((ahora - fechaCita) / (1000 * 60 * 60 * 24));

            if (cita.fecha === hoy) {
                totalHoy += Number(cita.precio);
            }

            if (diferenciaDias >= 0 && diferenciaDias <= 7) {
                totalSemana += Number(cita.precio);
            }

            if (
                fechaCita.getMonth() === ahora.getMonth() &&
                fechaCita.getFullYear() === ahora.getFullYear()
            ) {
                totalMes += Number(cita.precio);
            }
        }
    });

    document.getElementById("gananciaHoy").textContent = "$" + totalHoy.toLocaleString("es-CO");
    document.getElementById("gananciaSemana").textContent = "$" + totalSemana.toLocaleString("es-CO");
    document.getElementById("gananciaMes").textContent = "$" + totalMes.toLocaleString("es-CO");

    document.getElementById("citasTerminadas").textContent = terminadas;
    document.getElementById("citasConfirmadas").textContent = confirmadas;
    document.getElementById("citasCanceladas").textContent = canceladas;
}

function aplicarFiltroFecha(tipo) {
    filtroFechaActual = tipo;
    mostrarCitas();
}

function coincideFiltroFecha(cita) {
    if (filtroFechaActual === "todas") return true;

    let hoy = new Date();
    let fechaCita = crearFechaHora(cita.fecha, cita.horaInicio);

    let inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let manana = new Date(inicioHoy);
    manana.setDate(manana.getDate() + 1);

    if (filtroFechaActual === "hoy") {
        return cita.fecha === obtenerFechaHoy();
    }

    if (filtroFechaActual === "manana") {
        let anio = manana.getFullYear();
        let mes = String(manana.getMonth() + 1).padStart(2, "0");
        let dia = String(manana.getDate()).padStart(2, "0");
        return cita.fecha === `${anio}-${mes}-${dia}`;
    }

    if (filtroFechaActual === "semana") {
        let finSemana = new Date(inicioHoy);
        finSemana.setDate(finSemana.getDate() + 7);
        return fechaCita >= inicioHoy && fechaCita <= finSemana;
    }

    if (filtroFechaActual === "mes") {
        return fechaCita.getMonth() === hoy.getMonth() && fechaCita.getFullYear() === hoy.getFullYear();
    }

    return true;
}

function mostrarCitas() {
    actualizarEstadosAutomaticos();

    let lista = document.getElementById("listaCitas");
    let totalGeneral = document.getElementById("totalGeneral");
    let totalCitas = document.getElementById("totalCitas");
    let textoBusqueda = document.getElementById("buscador")?.value.toLowerCase() || "";
    let filtroEstado = document.getElementById("filtroEstado")?.value || "Todas";

    lista.innerHTML = "";

    let sumaTotalTerminadas = 0;

    citas.forEach(cita => {
        if (cita.estado === "Terminada") {
            sumaTotalTerminadas += Number(cita.precio);
        }
    });

    totalGeneral.textContent = "$" + sumaTotalTerminadas.toLocaleString("es-CO");
    totalCitas.textContent = citas.length;

    actualizarResumenGanancias();

    let citasOrdenadas = [...citas].sort((a, b) => {
        return crearFechaHora(a.fecha, a.horaInicio) - crearFechaHora(b.fecha, b.horaInicio);
    });

    let citasFiltradas = citasOrdenadas.filter(cita => {
        let coincideBusqueda =
            cita.cliente.toLowerCase().includes(textoBusqueda) ||
            cita.servicio.toLowerCase().includes(textoBusqueda) ||
            cita.estado.toLowerCase().includes(textoBusqueda) ||
            cita.fecha.includes(textoBusqueda) ||
            cita.horaInicio.includes(textoBusqueda) ||
            cita.horaFin.includes(textoBusqueda);

        let coincideEstado = filtroEstado === "Todas" || cita.estado === filtroEstado;

        return coincideBusqueda && coincideEstado && coincideFiltroFecha(cita);
    });

    if (citasFiltradas.length === 0) {
        lista.innerHTML = `<p class="empty">No hay citas registradas.</p>`;
    } else {
        citasFiltradas.forEach((cita) => {
            let indexReal = citas.findIndex(item => item.id === cita.id);

            let textoRecordatorio = "";

            if (cita.estado === "Confirmada") {
                textoRecordatorio = cita.recordatorioEnviado
                    ? `<div class="recordatorio-info">Recordatorio enviado o abierto en WhatsApp</div>`
                    : `<div class="recordatorio-info">Recordatorio pendiente: se activa 1 día antes</div>`;
            }

            let botonWhatsApp = "";

            if (cita.estado === "Confirmada") {
                botonWhatsApp = `
                    <button class="btn-whatsapp" onclick="enviarRecordatorio(${indexReal})">
                        Enviar recordatorio por WhatsApp
                    </button>
                `;
            }

            let botonConfirmar = "";

            if (cita.estado === "Pendiente") {
                botonConfirmar = `
                    <button class="btn-confirmar" onclick="confirmarCitaWhatsApp(${indexReal})">
                        Confirmar cita por WhatsApp
                    </button>
                `;
            }

            let botonCancelar = "";

            if (cita.estado === "Pendiente" || cita.estado === "Confirmada") {
                botonCancelar = `
                    <button class="btn-cancelar-whatsapp" onclick="cancelarCitaWhatsApp(${indexReal})">
                        Cancelar cita por WhatsApp
                    </button>
                `;
            }

            lista.innerHTML += `
                <div class="cita cita-${cita.estado}">
                    <div class="cita-header">
                        <h3>${cita.cliente}</h3>
                        <span class="badge ${claseEstado(cita.estado)}">${mostrarTextoEstado(cita.estado)}</span>
                    </div>

                    <p><strong>📞 Teléfono:</strong> ${cita.telefono}</p>
                    <p><strong>💖 Servicio:</strong> ${cita.servicio}</p>
                    <p><strong>📅 Fecha:</strong> ${formatearFecha(cita.fecha)}</p>
                    <p><strong>🕒 Inicio:</strong> ${cita.horaInicio}</p>
                    <p><strong>⏳ Fin del servicio:</strong> ${cita.horaFin}</p>
                    <p><strong>💰 Valor:</strong> $${Number(cita.precio).toLocaleString("es-CO")}</p>
                    ${textoRecordatorio}

                    ${botonWhatsApp}
                    ${botonConfirmar}
                    ${botonCancelar}

                    <button class="btn-editar" onclick="editarCita(${indexReal})">
                        Editar cita
                    </button>

                    <button class="btn-eliminar" onclick="eliminarCita(${indexReal})">
                        Eliminar cita
                    </button>
                </div>
            `;
        });
    }

    if (document.getElementById("fechaCalendario")) mostrarCalendario();
    if (document.getElementById("listaCitasHoy")) mostrarCitasHoy();
}

function abrirWhatsApp(telefono, mensaje) {
    let numero = telefono.replace(/\D/g, "");

    if (numero.length === 10) {
        numero = "57" + numero;
    }

    let url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}

function enviarRecordatorio(index) {
    let cita = citas[index];

    if (cita.estado !== "Confirmada") {
        alert("Solo se puede enviar recordatorio a citas confirmadas.");
        return;
    }

    let mensaje = `Hola, ${cita.cliente} 💅✨

Te recordamos tu cita en Gota de Arte Nails.

📅 Fecha: ${formatearFecha(cita.fecha)}
🕒 Hora de inicio: ${cita.horaInicio}
⏳ Hora fin del servicio: ${cita.horaFin}
💖 Servicio: ${cita.servicio}
💰 Valor: $${Number(cita.precio).toLocaleString("es-CO")}

Por favor confirma tu asistencia respondiendo a este mensaje.
¡Te esperamos para consentir tus uñas con mucho arte! 🌸`;

    abrirWhatsApp(cita.telefono, mensaje);
}

function confirmarCitaWhatsApp(index) {
    citas[index].estado = "Confirmada";
    citas[index].recordatorioEnviado = false;
    guardarDatos();
    mostrarCitas();

    let cita = citas[index];

    let mensaje = `Hola, ${cita.cliente} 💅✨

Tu cita en Gota de Arte Nails ha sido confirmada.

📅 Fecha: ${formatearFecha(cita.fecha)}
🕒 Hora: ${cita.horaInicio}
💖 Servicio: ${cita.servicio}
💰 Valor: $${Number(cita.precio).toLocaleString("es-CO")}

¡Te esperamos! 🌸`;

    abrirWhatsApp(cita.telefono, mensaje);
}

function cancelarCitaWhatsApp(index) {
    let confirmar = confirm("¿Deseas cancelar esta cita y enviar aviso por WhatsApp?");

    if (!confirmar) return;

    citas[index].estado = "Cancelada";
    guardarDatos();
    mostrarCitas();

    let cita = citas[index];

    let mensaje = `Hola, ${cita.cliente}.

Te informamos que tu cita en Gota de Arte Nails ha sido cancelada.

📅 Fecha: ${formatearFecha(cita.fecha)}
🕒 Hora: ${cita.horaInicio}
💖 Servicio: ${cita.servicio}

Puedes escribirnos para reagendar una nueva cita.`;

    abrirWhatsApp(cita.telefono, mensaje);
}

function exportarExcel() {
    if (citas.length === 0) {
        alert("No hay citas para exportar.");
        return;
    }

    let filas = [
        ["Cliente", "Teléfono", "Servicio", "Fecha", "Hora inicio", "Hora fin", "Valor", "Estado"]
    ];

    citas.forEach(cita => {
        filas.push([
            cita.cliente,
            cita.telefono,
            cita.servicio,
            formatearFecha(cita.fecha),
            cita.horaInicio,
            cita.horaFin,
            cita.precio,
            mostrarTextoEstado(cita.estado)
        ]);
    });

    let contenido = filas.map(fila => fila.join(";")).join("\n");
    let blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

    let enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "historial_gota_de_arte_nails.csv";
    enlace.click();
}

function descargarBackup() {
    let datos = JSON.stringify(citas, null, 2);
    let blob = new Blob([datos], { type: "application/json" });

    let enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = "backup_gota_de_arte_nails.json";
    enlace.click();
}

function restaurarBackup(event) {
    let archivo = event.target.files[0];

    if (!archivo) return;

    let lector = new FileReader();

    lector.onload = function(e) {
        try {
            let datos = JSON.parse(e.target.result);

            if (!Array.isArray(datos)) {
                alert("El archivo no es válido.");
                return;
            }

            let confirmar = confirm("¿Deseas restaurar esta copia de seguridad? Se reemplazará el historial actual.");

            if (confirmar) {
                citas = datos;
                guardarDatos();
                mostrarCitas();
                alert("Copia de seguridad restaurada correctamente.");
            }
        } catch (error) {
            alert("No se pudo leer el archivo de copia de seguridad.");
        }
    };

    lector.readAsText(archivo);
}

function eliminarCita(index) {
    let confirmar = confirm("¿Deseas eliminar esta cita?");

    if (confirmar) {
        citas.splice(index, 1);
        guardarDatos();
        mostrarCitas();
    }
}

function eliminarTodasLasCitas() {
    if (citas.length === 0) {
        alert("No hay citas para eliminar.");
        return;
    }

    let confirmar = confirm("¿Seguro que deseas eliminar todo el historial?");

    if (confirmar) {
        citas = [];
        guardarDatos();
        mostrarCitas();
    }
}

function cancelarEdicion() {
    editando = false;
    idCitaEditando = null;

    document.getElementById("tituloFormulario").textContent = "Registrar cita";
    document.getElementById("btnGuardar").textContent = "Guardar cita";
    document.getElementById("btnCancelar").style.display = "none";

    limpiarFormulario();
}

function limpiarFormulario() {
    document.getElementById("cliente").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("servicio").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("horaInicio").value = "";
    document.getElementById("horaFin").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("estado").value = "Pendiente";
}

function guardarDatos() {
    localStorage.setItem("citas", JSON.stringify(citas));
}

function formatearFecha(fecha) {
    let partes = fecha.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

mostrarCitas();

setInterval(() => {
    actualizarEstadosAutomaticos();
    revisarRecordatoriosAutomaticos();
    mostrarCitas();
}, 30000);