let citas = JSON.parse(localStorage.getItem("citas")) || [];
let editando = false;
let idCitaEditando = null;

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

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
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

    let anio = Number(partesFecha[0]);
    let mes = Number(partesFecha[1]) - 1;
    let dia = Number(partesFecha[2]);
    let horas = Number(partesHora[0]);
    let minutos = Number(partesHora[1]);

    return new Date(anio, mes, dia, horas, minutos, 0);
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

            return {
                ...cita,
                estado: "Terminada"
            };
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

        if (
            diferenciaMinutos <= 60 &&
            diferenciaMinutos > 0 &&
            cita.estado === "Confirmada" &&
            cita.recordatorioEnviado !== true
        ) {
            alert(`Recordatorio automático: falta una hora o menos para la cita de ${cita.cliente}. Se abrirá WhatsApp con el mensaje listo.`);

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
    if (estado === "Terminada") {
        return "Terminada";
    }

    return estado;
}

function obtenerFechaHoy() {
    let hoy = new Date();
    let anio = hoy.getFullYear();
    let mes = String(hoy.getMonth() + 1).padStart(2, "0");
    let dia = String(hoy.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function mostrarCitasHoy() {
    actualizarEstadosAutomaticos();

    let contenedor = document.getElementById("listaCitasHoy");
    let fechaHoy = obtenerFechaHoy();

    let citasHoy = citas
        .filter(cita => cita.fecha === fechaHoy && cita.estado !== "Cancelada")
        .sort((a, b) => {
            let fechaA = crearFechaHora(a.fecha, a.horaInicio);
            let fechaB = crearFechaHora(b.fecha, b.horaInicio);
            return fechaA - fechaB;
        });

    if (citasHoy.length === 0) {
        contenedor.innerHTML = `
            <div class="disponible">
                Hoy no hay citas agendadas.
            </div>
        `;
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
        .sort((a, b) => {
            let fechaA = crearFechaHora(a.fecha, a.horaInicio);
            let fechaB = crearFechaHora(b.fecha, b.horaInicio);
            return fechaA - fechaB;
        });

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

    html += `
        <div class="horario-libre">
            Los espacios que no estén dentro de estos rangos están disponibles.
        </div>
    `;

    resultado.innerHTML = html;
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

    let citasOrdenadas = [...citas].sort((a, b) => {
        let fechaA = crearFechaHora(a.fecha, a.horaInicio);
        let fechaB = crearFechaHora(b.fecha, b.horaInicio);
        return fechaA - fechaB;
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

        return coincideBusqueda && coincideEstado;
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
                    : `<div class="recordatorio-info">Recordatorio pendiente: se activa 1 hora antes</div>`;
            }

            let botonWhatsApp = "";

            if (cita.estado === "Confirmada") {
                botonWhatsApp = `
                    <button class="btn-whatsapp" onclick="enviarRecordatorio(${indexReal})">
                        Enviar recordatorio por WhatsApp
                    </button>
                `;
            }

            lista.innerHTML += `
                <div class="cita">
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

    if (document.getElementById("fechaCalendario")) {
        mostrarCalendario();
    }

    if (document.getElementById("listaCitasHoy")) {
        mostrarCitasHoy();
    }
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
📌 Estado: ${mostrarTextoEstado(cita.estado)}

Por favor confirma tu asistencia respondiendo a este mensaje.
¡Te esperamos para consentir tus uñas con mucho arte! 🌸`;

    let telefono = cita.telefono.replace(/\D/g, "");

    if (telefono.length === 10) {
        telefono = "57" + telefono;
    }

    let url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");
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