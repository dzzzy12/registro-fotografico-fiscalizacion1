let db;
let proyectoActivoId = null;
let fotosProyecto = [];
let fotoSeleccionadaId = null;
let colaArchivos = [];

// 1. INICIAR INDEXEDDB
const reqDB = indexedDB.open("FiscalizacionV15_DB", 1);

reqDB.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("proyectos")) {
        db.createObjectStore("proyectos", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("fotos")) {
        const store = db.createObjectStore("fotos", { keyPath: "id" });
        store.createIndex("proyectoId", "proyectoId", { unique: false });
    }
};

reqDB.onsuccess = (e) => {
    db = e.target.result;
    document.getElementById("fecha").valueAsDate = new Date();
    actualizarSelectorProyectos();
    const ultimoId = localStorage.getItem("v15_ultimoProyecto");
    if (ultimoId) {
        abrirProyecto(ultimoId);
    } else {
        crearProyectoPorDefecto();
    }
};

function mostrarAlerta(msj, tipo = "info") {
    const el = document.getElementById("alerta");
    el.textContent = msj;
    el.className = `alerta ${tipo}`;
    setTimeout(() => el.classList.add("oculto"), 4000);
}

// 2. GESTIÓN DE PROYECTOS
function crearProyectoPorDefecto() {
    const id = "PROJ_" + Date.now();
    const nuevo = {
        id,
        tituloAnexo: "ANEXO 2 REGISTRO FOTOGRÁFICO",
        codigo: "PRACTICA 001",
        fecha: new Date().toISOString().split("T")[0],
        establecimiento: "EMPRESA DE TRANSPORTES NORWI E.I.R.L. (PRÁCTICA)",
        lugar: "Espacio de práctica autorizado",
        fiscalizador: "Alumno de práctica"
    };
    const tx = db.transaction(["proyectos"], "readwrite");
    tx.objectStore("proyectos").put(nuevo);
    tx.oncomplete = () => {
        localStorage.setItem("v15_ultimoProyecto", id);
        actualizarSelectorProyectos(id);
        abrirProyecto(id);
    };
}

function guardarProyectoActual(mostrarMsj = true) {
    if (!proyectoActivoId) return;
    const proy = {
        id: proyectoActivoId,
        tituloAnexo: document.getElementById("tituloAnexo").value.trim(),
        codigo: document.getElementById("codigo").value.trim(),
        fecha: document.getElementById("fecha").value,
        establecimiento: document.getElementById("establecimiento").value.trim(),
        lugar: document.getElementById("lugar").value.trim(),
        fiscalizador: document.getElementById("fiscalizador").value.trim()
    };
    const tx = db.transaction(["proyectos"], "readwrite");
    tx.objectStore("proyectos").put(proy);
    tx.oncomplete = () => {
        actualizarSelectorProyectos(proyectoActivoId);
        if (mostrarMsj) mostrarAlerta("Datos del proyecto guardados en IndexedDB.");
    };
}

document.getElementById("btnGuardarProyecto").addEventListener("click", () => guardarProyectoActual(true));

document.getElementById("btnNuevoProyecto").addEventListener("click", () => {
    const id = "PROJ_" + Date.now();
    const nuevo = {
        id,
        tituloAnexo: "ANEXO 2 REGISTRO FOTOGRÁFICO",
        codigo: "PRACTICA " + Math.floor(100 + Math.random() * 900),
        fecha: new Date().toISOString().split("T")[0],
        establecimiento: "",
        lugar: "",
        fiscalizador: ""
    };
    const tx = db.transaction(["proyectos"], "readwrite");
    tx.objectStore("proyectos").put(nuevo);
    tx.oncomplete = () => {
        localStorage.setItem("v15_ultimoProyecto", id);
        actualizarSelectorProyectos(id);
        abrirProyecto(id);
        mostrarAlerta("Nuevo proyecto creado e independiente.");
    };
});

function actualizarSelectorProyectos(seleccionado = "") {
    const tx = db.transaction(["proyectos"], "readonly");
    const req = tx.objectStore("proyectos").getAll();
    req.onsuccess = () => {
        const sel = document.getElementById("selectProyecto");
        sel.innerHTML = `<option value="">Abrir proyecto...</option>`;
        req.result.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.codigo} - ${p.establecimiento || "Sin nombre"}`;
            if (p.id === seleccionado) opt.selected = true;
            sel.appendChild(opt);
        });
    };
}

document.getElementById("selectProyecto").addEventListener("change", (e) => {
    if (e.target.value) abrirProyecto(e.target.value);
});

function abrirProyecto(id) {
    const tx = db.transaction(["proyectos"], "readonly");
    const req = tx.objectStore("proyectos").get(id);
    req.onsuccess = () => {
        const p = req.result;
        if (!p) return;
        proyectoActivoId = p.id;
        localStorage.setItem("v15_ultimoProyecto", p.id);
        document.getElementById("tituloAnexo").value = p.tituloAnexo || "ANEXO 2 REGISTRO FOTOGRÁFICO";
        document.getElementById("codigo").value = p.codigo || "";
        document.getElementById("fecha").value = p.fecha || "";
        document.getElementById("establecimiento").value = p.establecimiento || "";
        document.getElementById("lugar").value = p.lugar || "";
        document.getElementById("fiscalizador").value = p.fiscalizador || "";
        fotoSeleccionadaId = null;
        cargarFotos();
    };
}

// 3. CAPTURA Y VISTA PREVIA
function iniciarVistaPreviaArchivos(e) {
    const files = Array.from(e.target.files);
    if (!files.length) {
        mostrarAlerta("Captura o selección cancelada por el usuario. Puede continuar.", "info");
        return;
    }
    colaArchivos = files;
    mostrarSiguienteEnCola();
    e.target.value = "";
}

document.getElementById("inputArchivo").addEventListener("change", iniciarVistaPreviaArchivos);
document.getElementById("inputCamara").addEventListener("change", iniciarVistaPreviaArchivos);

function mostrarSiguienteEnCola() {
    if (colaArchivos.length === 0) {
        document.getElementById("modalPrevia").classList.add("oculto");
        cargarFotos();
        return;
    }
    const archivoActual = colaArchivos[0];
    document.getElementById("imgPreviaModal").src = URL.createObjectURL(archivoActual);
    document.getElementById("descPreviaModal").value = "";
    document.getElementById("modalPrevia").classList.remove("oculto");
}

document.getElementById("btnConfirmarCaptura").addEventListener("click", () => {
    const archivo = colaArchivos.shift();
    const desc = document.getElementById("descPreviaModal").value.trim();
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString("es-PE") + " " + ahora.toLocaleTimeString("es-PE", { hour12: false });

    const nuevaFoto = {
        id: String(Date.now()) + Math.floor(Math.random() * 100),
        proyectoId: proyectoActivoId,
        nombreArchivo: archivo.name,
        imagenBlob: archivo,
        descripcion: desc,
        fechaHora: fechaStr,
        orden: fotosProyecto.length + 1
    };

    const tx = db.transaction(["fotos"], "readwrite");
    tx.objectStore("fotos").put(nuevaFoto);
    tx.oncomplete = () => {
        fotoSeleccionadaId = nuevaFoto.id;
        mostrarAlerta("Fotografía guardada en IndexedDB.");
        mostrarSiguienteEnCola();
    };
});

document.getElementById("btnCancelarCaptura").addEventListener("click", () => {
    colaArchivos.shift();
    mostrarAlerta("Captura descartada. Puede continuar.");
    mostrarSiguienteEnCola();
});

// 4. TABLA IZQUIERDA Y VISOR DERECHO
function cargarFotos() {
    const tx = db.transaction(["fotos"], "readonly");
    const idx = tx.objectStore("fotos").index("proyectoId");
    const req = idx.getAll(proyectoActivoId);

    req.onsuccess = () => {
        fotosProyecto = req.result.sort((a, b) => a.orden - b.orden);
        if (!fotoSeleccionadaId && fotosProyecto.length > 0) {
            fotoSeleccionadaId = fotosProyecto[0].id;
        }
        renderizarInterfaz();
    };
}

document.getElementById("filtroEstado").addEventListener("change", renderizarInterfaz);

function renderizarInterfaz() {
    const tbody = document.getElementById("tablaCuerpo");
    tbody.innerHTML = "";

    const filtro = document.getElementById("filtroEstado").value;
    let asignadas = 0;
    let pendientes = 0;

    fotosProyecto.forEach((f, idx) => {
        const tieneDesc = f.descripcion && f.descripcion.trim().length > 0;
        if (tieneDesc) asignadas++; else pendientes++;

        const estadoTexto = tieneDesc ? "Asignada" : "Pendiente";
        if (filtro !== "Todas" && filtro !== estadoTexto) return;

        const tr = document.createElement("tr");
        if (f.id === fotoSeleccionadaId) tr.classList.add("seleccionada");

        const urlImg = URL.createObjectURL(f.imagenBlob);
        const numWord = `Foto N° ${String(idx + 1).padStart(2, "0")}`;

        tr.innerHTML = `
            <td>
                <div class="celda-foto">
                    <img src="${urlImg}" alt="Miniatura">
                    <span class="codigo-foto">${f.id.slice(0, 12)}</span>
                </div>
            </td>
            <td style="text-align:center;">${f.fechaHora}</td>
            <td style="text-align:center;">${numWord}</td>
            <td style="text-align:center;">${estadoTexto}</td>
        `;

        tr.addEventListener("click", () => {
            fotoSeleccionadaId = f.id;
            renderizarInterfaz();
        });

        tbody.appendChild(tr);
    });

    document.getElementById("resumenConteo").textContent = `${pendientes} pendientes · ${asignadas} asignadas`;
    actualizarPanelDerecho();
}

function actualizarPanelDerecho() {
    const foto = fotosProyecto.find(f => f.id === fotoSeleccionadaId);
    const imgGrande = document.getElementById("visorFotoGrande");
    const visorVacio = document.getElementById("visorVacio");
    const txtDesc = document.getElementById("txtDescripcionEditable");
    const infoArchivo = document.getElementById("infoArchivo");

    if (!foto) {
        imgGrande.classList.add("oculto");
        visorVacio.classList.remove("oculto");
        txtDesc.value = "";
        txtDesc.disabled = true;
        return;
    }

    imgGrande.src = URL.createObjectURL(foto.imagenBlob);
    imgGrande.classList.remove("oculto");
    visorVacio.classList.add("oculto");
    txtDesc.disabled = false;
    txtDesc.value = foto.descripcion || "";
    infoArchivo.textContent = `Miniaturas medianas a la izquierda · ID: ${foto.id}.jpg · ${foto.fechaHora} · Marca temporal de ingreso en app (No certifica fecha original)`;
}

// Edición en tiempo real de la descripción
document.getElementById("txtDescripcionEditable").addEventListener("input", (e) => {
    const foto = fotosProyecto.find(f => f.id === fotoSeleccionadaId);
    if (!foto) return;
    foto.descripcion = e.target.value;

    const tx = db.transaction(["fotos"], "readwrite");
    tx.objectStore("fotos").put(foto);
    tx.oncomplete = () => {
        let asignadas = 0, pendientes = 0;
        fotosProyecto.forEach(f => (f.descripcion && f.descripcion.trim()) ? asignadas++ : pendientes++);
        document.getElementById("resumenConteo").textContent = `${pendientes} pendientes · ${asignadas} asignadas`;
    };
});

document.getElementById("txtDescripcionEditable").addEventListener("blur", () => renderizarInterfaz());

document.getElementById("selectPlantilla").addEventListener("change", (e) => {
    if (!e.target.value || !fotoSeleccionadaId) return;
    const txt = document.getElementById("txtDescripcionEditable");
    txt.value = e.target.value;
    txt.dispatchEvent(new Event("input"));
    renderizarInterfaz();
});

document.getElementById("btnLimpiarDesc").addEventListener("click", () => {
    if (!fotoSeleccionadaId) return;
    const txt = document.getElementById("txtDescripcionEditable");
    txt.value = "";
    txt.dispatchEvent(new Event("input"));
    renderizarInterfaz();
});

document.getElementById("btnDevolverPendientes").addEventListener("click", () => {
    document.getElementById("btnLimpiarDesc").click();
});

// 5. ORDENAMIENTO (SUBIR / BAJAR) Y ELIMINACIÓN
function cambiarOrden(direccion) {
    const idx = fotosProyecto.findIndex(f => f.id === fotoSeleccionadaId);
    if (idx === -1) return;
    const nuevoIdx = idx + direccion;
    if (nuevoIdx < 0 || nuevoIdx >= fotosProyecto.length) return;

    const temp = fotosProyecto[idx];
    fotosProyecto[idx] = fotosProyecto[nuevoIdx];
    fotosProyecto[nuevoIdx] = temp;

    const tx = db.transaction(["fotos"], "readwrite");
    const store = tx.objectStore("fotos");
    fotosProyecto.forEach((f, i) => {
        f.orden = i + 1;
        store.put(f);
    });
    tx.oncomplete = () => cargarFotos();
}

document.getElementById("btnSubir").addEventListener("click", () => cambiarOrden(-1));
document.getElementById("btnBajar").addEventListener("click", () => cambiarOrden(1));

document.getElementById("btnEliminarFoto").addEventListener("click", () => {
    if (!fotoSeleccionadaId) return;
    if (!confirm("¿Está seguro de eliminar esta fotografía del anexo?")) return;

    const tx = db.transaction(["fotos"], "readwrite");
    tx.objectStore("fotos").delete(fotoSeleccionadaId);
    tx.oncomplete = () => {
        fotosProyecto = fotosProyecto.filter(f => f.id !== fotoSeleccionadaId);
        fotoSeleccionadaId = fotosProyecto.length ? fotosProyecto[0].id : null;
        const txOrden = db.transaction(["fotos"], "readwrite");
        const store = txOrden.objectStore("fotos");
        fotosProyecto.forEach((f, i) => {
            f.orden = i + 1;
            store.put(f);
        });
        txOrden.oncomplete = () => {
            cargarFotos();
            mostrarAlerta("Fotografía eliminada y numeración actualizada.");
        };
    };
});

// 6. EXPORTAR A WORD (.DOCX REAL CON PROPORCIÓN Y 2 FOTOS POR PÁGINA)
document.getElementById("btnExportarWord").addEventListener("click", async () => {
    guardarProyectoActual(false);

    const codigo = document.getElementById("codigo").value.trim();
    const fecha = document.getElementById("fecha").value;
    const lugar = document.getElementById("lugar").value.trim();
    const fiscalizador = document.getElementById("fiscalizador").value.trim();
    const establecimiento = document.getElementById("establecimiento").value.trim();

    if (!codigo || !fecha || !lugar || !fiscalizador || !establecimiento) {
        mostrarAlerta("Error: Complete todos los datos obligatorios de la fiscalización (Código, Fecha, Razón Social, Lugar y Fiscalizador).", "error");
        return;
    }
    if (fotosProyecto.length === 0) {
        mostrarAlerta("Error: No hay fotografías registradas en el proyecto.", "error");
        return;
    }
    const faltanDescripciones = fotosProyecto.some(f => !f.descripcion || !f.descripcion.trim());
    if (faltanDescripciones) {
        mostrarAlerta("Error: Todas las fotografías deben tener descripción asignada antes de generar el Word.", "error");
        return;
    }

    try {
        mostrarAlerta("Generando documento Word (.docx)...");
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun } = docx;

        const filas = [
            new TableRow({
                cantSplit: true,
                children: [
                    new TableCell({
                        columnSpan: 2,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                keepNext: true,
                                children: [new TextRun({ text: `FOTOGRAFÍAS DE FECHA ${fecha}`, font: "Poppins", size: 16, bold: true })]
                            })
                        ]
                    })
                ]
            })
        ];

        for (let i = 0; i < fotosProyecto.length; i++) {
            const f = fotosProyecto[i];
            const buffer = await f.imagenBlob.arrayBuffer();
            const etiquetaNum = `Foto N.º ${String(i + 1).padStart(2, "0")}`;

            // 1. Cálculo proporcional de dimensiones (Evita deformar horizontales o verticales)
            const img = new Image();
            const imageUrl = URL.createObjectURL(f.imagenBlob);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            const maxWidth = 420;
            const maxHeight = 255;

            let width = img.naturalWidth;
            let height = img.naturalHeight;

            const ratio = Math.min(maxWidth / width, maxHeight / height);

            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            URL.revokeObjectURL(imageUrl);

            // 2. Control de 2 fotos por página:
            // Si es la foto 3 (i=2), foto 5 (i=4), etc., aplica salto de página limpio al inicio de la fila de la foto
            const iniciarNuevaPagina = (i > 0 && i % 2 === 0);

            // Fila de la fotografía (combinada de ancho completo)
            filas.push(
                new TableRow({
                    cantSplit: true,
                    children: [
                        new TableCell({
                            columnSpan: 2,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    keepNext: true, // Mantiene la foto pegada a su fila de descripción inferior
                                    pageBreakBefore: iniciarNuevaPagina, // Abre página nueva cada 2 fotos sin crear celdas vacías
                                    children: [
                                        new ImageRun({
                                            data: buffer,
                                            transformation: { width, height }
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            );

            // Fila inferior: Número a la izquierda (25%) y descripción a la derecha (75%)
            filas.push(
                new TableRow({
                    cantSplit: true,
                    children: [
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: etiquetaNum, font: "Poppins", size: 16, bold: true })]
                                })
                            ]
                        }),
                        new TableCell({
                            width: { size: 75, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: f.descripcion.trim(), font: "Poppins", size: 16 })]
                                })
                            ]
                        })
                    ]
                })
            );
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        size: { width: 11906, height: 16838 }, // A4 Vertical
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // Márgenes de 2.54 cm
                    }
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: document.getElementById("tituloAnexo").value, font: "Poppins", size: 20, bold: true })]
                    }),
                    new Paragraph({ children: [new TextRun({ text: `Código: ${codigo}`, font: "Poppins", size: 16 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Fiscalizador: ${fiscalizador}`, font: "Poppins", size: 16 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Lugar: ${lugar}`, font: "Poppins", size: 16 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Establecimiento / Unidad: ${establecimiento}`, font: "Poppins", size: 16 })] }),
                    new Paragraph({ text: "" }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: filas
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Anexo_${codigo.replace(/\s+/g, "_")}.docx`);
        mostrarAlerta("Archivo Word (.docx) generado correctamente.");
    } catch (e) {
        console.error(e);
        mostrarAlerta("Error al generar el Word.", "error");
    }
});