# Proyecto de Registro Fotográfico de Fiscalización en Campo (HT 03)

## 1. Descripción del proyecto

Aplicación frontend desarrollada con HTML, CSS y JavaScript para registrar información de proyectos de fiscalización, capturar o seleccionar fotografías, editar sus descripciones, organizar las imágenes y generar un documento Word (`.docx`) con el anexo fotográfico.

## 2. Instrucciones de ejecución

1. Descomprimir el archivo ZIP del proyecto.
2. Abrir la carpeta del proyecto en Visual Studio Code.
3. Instalar la extensión **Live Server**, si todavía no está instalada.
4. Abrir el archivo `index.html`.
5. Hacer clic derecho sobre el archivo y seleccionar **Open with Live Server**.
6. La aplicación se abrirá en el navegador predeterminado.

## 3. Tecnologías y dependencias utilizadas

- **HTML5:** estructura de la aplicación.
- **CSS3:** estilos y diseño adaptable a diferentes tamaños de pantalla.
- **JavaScript:** eventos, validaciones y lógica de funcionamiento.
- **IndexedDB API:** almacenamiento local persistente de proyectos, información y fotografías en formato `Blob`.
- **docx.js (v8.5.0):** generación de documentos Word en formato `.docx`.
- **FileSaver.js (v2.0.5):** descarga del documento generado.

El documento exportado está diseñado en formato A4 vertical e incorpora las fotografías y sus descripciones.

## 4. Acceso y pruebas desde el celular

La aplicación se probó desde un teléfono celular utilizando Live Server y la red Wi-Fi local.

### Pasos para acceder desde el celular

1. Conectar la computadora y el celular a la misma red Wi-Fi.
2. Iniciar la aplicación desde Visual Studio Code mediante Live Server.
3. Identificar la dirección IPv4 local de la computadora ejecutando `ipconfig` en la terminal de Windows.
4. Abrir el navegador del celular e ingresar a la siguiente dirección utilizada durante las pruebas:

   **http://192.168.15.53:5500/index.html**

5. Pulsar el botón **Tomar foto (Cámara)** para abrir la opción de captura del dispositivo.
6. Seleccionar o tomar una fotografía, revisar su vista previa y confirmar su incorporación a la aplicación.

El campo `capture="environment"` solicita preferentemente la cámara trasera en los navegadores y dispositivos compatibles. El comportamiento exacto puede variar según el teléfono y el navegador.

**Importante:** la dirección IP indicada corresponde a la red local y puede cambiar. Para acceder desde otro dispositivo, este debe poder comunicarse con la computadora en esa red y el servidor debe permanecer activo.

## 5. Almacenamiento de información

Los datos de los proyectos y las fotografías se guardan localmente mediante IndexedDB. Las imágenes se almacenan como objetos `Blob`, evitando depender de rutas temporales de los archivos originales.

La información puede recuperarse al volver a abrir la aplicación en el mismo navegador y dispositivo, siempre que los datos del sitio no hayan sido eliminados y se mantenga el mismo origen de almacenamiento.

Los datos no se sincronizan automáticamente entre la computadora y el celular ni se almacenan en una nube.

## 6. Generación del documento Word

La aplicación permite generar y descargar un documento `.docx` con los datos del proyecto y las fotografías registradas.

Antes de exportar, se validan los campos obligatorios y las descripciones de las fotografías. Las imágenes se incorporan al documento junto con su numeración y descripción correspondiente.

## 7. Limitaciones conocidas

- La generación del documento requiere que las bibliotecas externas `docx.js` y `FileSaver.js` estén disponibles. Si se cargan desde un CDN, se necesita conexión a Internet para descargarlas.
- La cámara y otras funciones pueden depender de los permisos del navegador y de las condiciones de seguridad del acceso.
- El almacenamiento es local al navegador y al origen de la aplicación; no existe sincronización automática entre dispositivos.
- Si se borran los datos del navegador, se puede perder la información almacenada.
- La fecha y hora registradas corresponden al momento en que la fotografía se incorpora a la aplicación; no certifican la fecha original en que fue tomada.

## 8. Estructura del proyecto

```text
registro-fotografico-fiscalizacion/
├── index.html
├── README.md
├── css/
│   └── estilos.css
└── js/
    └── app.js
```

## 9. Autoría académica

**Institución:** SENATI  
**Carrera:** Ingeniería de Software con IA  
**Actividad:** Tarea HT 03 – Usa tecnologías frontend con JavaScript  
**Proyecto:** Registro Fotográfico de Fiscalización en Campo