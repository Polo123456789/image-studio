# PRD funcional - Estudio de imagenes generadas por IA

## 1. Resumen

Producto orientado a equipos internos que crean publicidad y contenido para redes sociales mediante IA.

La aplicacion debe permitir:

- definir el concepto de una imagen a partir de preguntas guiadas;
- apoyar la generacion con assets, referencias y guias de estilo;
- generar y editar imagenes usando IA;
- guardar las imagenes en una biblioteca tipo drive;
- conservar historial por versiones;
- gestionar assets, guias de estilo y marcas;
- configurar la API key del proveedor de IA.

La IA ya esta definida: `Google Flash Image 3`, con foco tanto en generacion como en edicion/iteracion de imagenes.

## 2. Objetivo del producto

Centralizar en un solo lugar el proceso creativo y operativo para producir imagenes publicitarias y piezas para redes sociales con IA, desde la ideacion hasta el almacenamiento y reutilizacion de activos.

## 3. Usuarios

Usuarios principales:

- equipo interno de creatividad;
- equipo de marketing y contenido;
- operadores que preparan assets, guias y generaciones.

En esta etapa no se considera acceso para clientes externos.

## 4. Alcance de esta primera definicion

Incluye:

- modulos principales del producto;
- flujos funcionales;
- entidades de informacion;
- requisitos funcionales base;
- criterios de organizacion y trazabilidad.

No incluye:

- decision de tecnologias;
- arquitectura tecnica;
- integraciones secundarias;
- definicion visual detallada de interfaz.

## 5. Principios del producto

- El flujo creativo debe ser guiado, no solo un campo libre de prompt.
- El sistema debe explorar multiples imagenes directamente dentro de las reglas definidas al inicio.
- La edicion e iteracion de imagenes es parte central del producto.
- La biblioteca debe sentirse como un drive organizado por carpetas y colecciones.
- Los assets y guias deben ser faciles de buscar.
- Las marcas deben poder tener su propio contexto, sin impedir reutilizar activos globales.
- La trazabilidad por version debe ser simple y util.

## 6. Modulos del producto

### 6.1. Estudio

Espacio principal de trabajo donde se crea una imagen o una linea de variantes.

La logica del estudio no debe limitarse a un solo resultado por intento. Debe favorecer la exploracion de multiples imagenes, ya que cuantos mas intentos se hagan bajo un marco bien definido, mayor probabilidad hay de obtener una imagen final util.

Flujo esperado:

1. El usuario inicia un nuevo proyecto o sesion creativa.
2. El usuario puede seleccionar una marca de forma opcional.
3. Si selecciona una marca, el sistema aplica su guia de estilo por defecto.
4. El sistema hace preguntas para construir el concepto de imagen.
5. El usuario adjunta o selecciona assets de ayuda.
6. Si hay marca asociada, los assets de esa marca se muestran primero al momento de elegir.
7. El usuario puede ajustar o complementar la guia de estilo aplicada.
8. El sistema estructura las reglas iniciales del trabajo y prepara el material para generar.
9. El usuario define cuántos conceptos quiere que el sistema proponga en esa ronda.
10. El sistema usa Gemini Flash para redactar varios conceptos visuales distintos dentro de las mismas reglas.
11. Para cada concepto, el sistema genera primero un preview rápido y barato con Imagen 4 en la primera relación de aspecto seleccionada.
12. El usuario revisa los conceptos en un workspace donde la imagen, el prompt y el historial por formato permanecen conectados.
13. El usuario puede regenerar el preview del formato actual antes de aprobar.
14. Si aprueba un concepto, el sistema usa Gemini Flash Image 3.1 para generar todas las relaciones de aspecto seleccionadas en calidad final.
15. Las imagenes generadas se guardan dentro de una carpeta con el nombre del proyecto.
16. El usuario selecciona las imagenes mas prometedoras.
17. El usuario itera o edita sobre esos resultados.
18. Cada iteracion se guarda como una nueva version dentro del historial de la imagen.

Capacidades necesarias:

- creacion guiada del concepto mediante preguntas;
- espacio para brief, objetivo y contexto;
- seleccion opcional de marca al inicio del flujo;
- aplicacion automatica de la guia de estilo de la marca seleccionada;
- definicion de reglas iniciales que actuan como marco comun de generacion;
- definicion por parte del usuario de cuántos conceptos generar por ronda;
- generacion de multiples conceptos visuales o variantes distintas dentro de ese marco;
- generación de preview inicial barato por concepto antes de pasar al modelo final;
- aprobación explícita del concepto antes de lanzar todas las versiones HD;
- seleccion de assets de apoyo;
- priorizacion de assets de la marca seleccionada al momento de elegir;
- seleccion y ajuste de guias de estilo;
- generacion inicial de conceptos y previews;
- seleccion de propuestas prometedoras antes de iterar;
- edicion/iteracion sobre resultados previos;
- guardado de versiones;
- acceso al historial de prompts y resultados por formato.

### 6.2. Biblioteca de imagenes

Espacio para almacenar y explorar las imagenes generadas, con organizacion tipo drive.

Las imagenes generadas desde el estudio deben almacenarse dentro de una carpeta cuyo nombre coincida con el proyecto que las origino.

Capacidades necesarias:

- navegacion por carpetas y colecciones;
- vista de imagenes generadas;
- apertura del detalle de cada imagen;
- acceso al historial de versiones;
- consulta de prompts por version;
- almacenamiento automatico dentro de la carpeta del proyecto;
- capacidad de reutilizar una imagen como base para nueva iteracion.

Cada version de imagen debe guardar como minimo:

- prompt;
- imagen resultante;
- fecha.

### 6.3. Gestion de assets

Espacio para administrar recursos utilizados en la generacion de imagenes.

Tipos de assets posibles:

- imagenes de referencia;
- logos;
- productos;
- fondos;
- elementos graficos;
- cualquier activo visual que ayude a orientar la generacion o edicion.

Capacidades necesarias:

- subir assets;
- previsualizarlos;
- organizarlos;
- asociarlos a marcas o dejarlos como globales;
- generar automaticamente una descripcion por IA;
- generar automaticamente tags por IA;
- permitir busqueda por texto y tags.

### 6.4. Gestion de guias de estilo

Espacio para administrar guias de estilo reutilizables de manera independiente.

Una guia de estilo puede incluir, por ejemplo:

- tono visual;
- referencias esteticas;
- instrucciones de composicion;
- tipo de iluminacion;
- reglas de color;
- estilo fotografico o ilustrativo;
- restricciones a evitar.

Capacidades necesarias:

- crear y editar guias de estilo;
- organizarlas y nombrarlas;
- reutilizarlas en distintos proyectos del estudio;
- asociarlas a una marca o dejarlas como globales.

### 6.5. Gestion de marcas

Espacio para definir marcas como contenedores de contexto.

Cada marca puede tener:

- assets propios;
- guias de estilo propias;
- identidad separada del resto del sistema.

Ademas, una marca debe poder reutilizar assets y guias globales cuando convenga.

Capacidades necesarias:

- crear marca;
- ver sus assets;
- ver sus guias de estilo;
- diferenciar recursos propios vs globales reutilizados;
- usar la marca como contexto opcional al iniciar trabajo en el estudio.

### 6.6. Configuracion

En esta etapa, la configuracion incluye solo:

- carga y gestion de la API key que se usara para generar y editar imagenes.

No se definiran mas opciones de configuracion por ahora.

## 7. Flujos principales

### 7.1. Crear una imagen desde cero

1. El usuario entra al estudio.
2. Crea una nueva sesion o proyecto.
3. Opcionalmente selecciona una marca.
4. Si selecciona una marca, el sistema carga su guia de estilo por defecto.
5. Responde preguntas guiadas para definir el concepto.
6. Adjunta o selecciona assets.
7. Si hay marca asociada, el sistema muestra primero los assets de esa marca.
8. Ajusta o complementa la guia de estilo si lo necesita.
9. Revisa las reglas e informacion consolidadas.
10. Define cuántos conceptos quiere generar en esa ronda.
11. El sistema propone varios conceptos con Gemini Flash.
12. El sistema genera un preview inicial barato por concepto con Imagen 4.
13. El usuario revisa y regenera previews si hace falta.
14. Aprueba uno o varios conceptos para lanzar la generación final HD en todos los formatos elegidos.
15. El resultado queda guardado en la biblioteca dentro de una carpeta con el nombre del proyecto.
16. Selecciona una o varias imagenes para continuar.

### 7.2. Iterar o editar una imagen existente

1. El usuario abre una imagen desde el estudio o desde la biblioteca.
2. Ve sus versiones anteriores.
3. Toma una version como base.
4. Ajusta prompt, assets o guia de estilo.
5. Lanza una nueva generacion o edicion.
6. El resultado se guarda como nueva version de la misma imagen.

### 7.3. Incorporar un nuevo asset

1. El usuario sube un asset.
2. El sistema genera descripcion automatica.
3. El sistema genera tags automaticos.
4. El usuario valida o ajusta esa informacion.
5. El asset queda disponible para busqueda y uso.

### 7.4. Crear una guia de estilo reutilizable

1. El usuario crea una nueva guia.
2. Define sus instrucciones y referencias.
3. Decide si sera global o asociada a una marca.
4. La guarda para reutilizarla luego en el estudio.

### 7.5. Crear una marca

1. El usuario crea la marca.
2. Le asigna assets y guias propias.
3. Decide si reutiliza recursos globales.
4. La marca queda disponible como contexto opcional en el estudio.

## 8. Entidades principales

### 8.1. Proyecto o sesion de estudio

Representa un trabajo creativo en curso.

Campos orientativos:

- nombre;
- brief o descripcion;
- respuestas a preguntas guiadas;
- reglas iniciales consolidadas;
- cantidad de conceptos por ronda;
- formatos elegidos para generación final;
- estado de aprobación del concepto;
- marca asociada opcional;
- assets vinculados;
- guias de estilo vinculadas;
- estado.

### 8.2. Imagen

Representa una pieza generada dentro del sistema.

Campos orientativos:

- identificador;
- nombre;
- carpeta o coleccion;
- proyecto de origen;
- fecha de creacion;
- version actual.

### 8.3. Version de imagen

Representa cada generacion o iteracion de una imagen.

Campos minimos definidos para esta etapa:

- prompt;
- imagen;
- fecha.

### 8.4. Asset

Campos orientativos:

- nombre;
- archivo;
- descripcion generada por IA;
- tags generados por IA;
- marca asociada opcional;
- disponibilidad global o de marca.

### 8.5. Guia de estilo

Campos orientativos:

- nombre;
- contenido o instrucciones;
- referencias visuales opcionales;
- marca asociada opcional;
- disponibilidad global o de marca.

### 8.6. Marca

Campos orientativos:

- nombre;
- descripcion;
- assets propios;
- guias propias;
- referencias globales reutilizadas.

## 9. Requisitos funcionales

### 9.1. Estudio

- El sistema debe guiar la creacion del concepto mediante preguntas.
- El sistema debe permitir seleccionar una marca al inicio del flujo de estudio.
- Si se selecciona una marca, el sistema debe aplicar su guia de estilo por defecto.
- El sistema debe consolidar la informacion inicial como un conjunto de reglas de trabajo.
- El sistema debe permitir agregar assets de ayuda.
- Si se selecciona una marca, el sistema debe priorizar los assets de esa marca al momento de elegir.
- El sistema debe permitir agregar guias de estilo.
- El sistema debe permitir ajustar o complementar la guia de estilo aplicada por la marca.
- El sistema debe permitir que el usuario defina cuántos conceptos quiere generar por ronda.
- El sistema debe permitir generar multiples conceptos distintos a partir de las mismas reglas iniciales.
- El sistema debe generar primero un preview barato por concepto antes de usar el modelo de mayor calidad.
- El sistema debe permitir aprobar explícitamente un concepto antes de lanzar todas sus versiones finales.
- El sistema debe mantener conectados el preview, el prompt y el historial por formato dentro del workspace de conceptos.
- El sistema debe mantener consistencia con el brief, la guia y los assets definidos al inicio.
- El sistema debe permitir seleccionar una o varias imagenes para continuar iterando.
- El sistema debe permitir editar o iterar imagenes ya generadas.
- El sistema debe guardar cada iteracion como nueva version.

### 9.2. Biblioteca

- El sistema debe ofrecer organizacion por carpetas y colecciones.
- El sistema debe crear o usar una carpeta con el nombre del proyecto para guardar sus imagenes.
- El sistema debe mostrar las imagenes generadas.
- El sistema debe permitir abrir el detalle de una imagen.
- El sistema debe mostrar el historial de versiones de cada imagen.
- El sistema debe mostrar el prompt de cada version.
- El sistema debe mostrar la fecha de cada version.

### 9.3. Assets

- El sistema debe permitir subir assets.
- El sistema debe generar descripcion automatica de cada asset.
- El sistema debe generar tags automaticos de cada asset.
- El sistema debe permitir corregir manualmente descripcion y tags.
- El sistema debe permitir buscar assets por texto y tags.
- El sistema debe permitir definir si un asset es global o de una marca.

### 9.4. Guias de estilo

- El sistema debe permitir crear, editar y eliminar guias de estilo.
- El sistema debe permitir marcar una guia como global o asociada a una marca.
- El sistema debe permitir reutilizar guias en el estudio.

### 9.5. Marcas

- El sistema debe permitir crear y gestionar marcas.
- El sistema debe permitir asignar assets propios a una marca.
- El sistema debe permitir asignar guias propias a una marca.
- El sistema debe permitir reutilizar assets y guias globales dentro de una marca.

### 9.6. Configuracion

- El sistema debe permitir introducir la API key.
- El sistema debe permitir editar o reemplazar la API key.

## 10. Criterios de organizacion

- La biblioteca de imagenes debe priorizar una experiencia tipo drive.
- La organizacion principal sera por carpetas y colecciones.
- Cada proyecto del estudio debe guardar sus resultados dentro de una carpeta con su mismo nombre.
- La iteracion no debe romper la relacion entre versiones de una misma imagen.
- Los recursos globales deben coexistir con recursos especificos de marca.
- Si el usuario elige una marca en el estudio, esa decision debe influir desde el inicio en la guia de estilo y en la prioridad de assets.
- El estudio debe favorecer exploracion amplia al inicio y refinamiento posterior sobre las imagenes mas fuertes.

## 11. Supuestos cerrados en esta definicion

- El documento sera un PRD funcional, no una especificacion tecnica.
- El sistema esta pensado primero para uso interno.
- La edicion/iteracion es una capacidad central.
- El estudio debe permitir generar multiples imagenes bajo un mismo marco inicial.
- El usuario definira cuantas imagenes generar en cada ronda.
- La organizacion principal de la biblioteca sera por carpetas y colecciones.
- Las imagenes de un proyecto se guardaran dentro de una carpeta con el nombre de ese proyecto.
- Cada iteracion de una imagen se guardara como nueva version.
- La marca sera un contexto opcional dentro del estudio.
- Si se selecciona una marca al iniciar el estudio, su guia de estilo se aplicara por defecto y sus assets tendran prioridad visual en la seleccion.
- La trazabilidad minima por version sera: prompt, imagen y fecha.
- La configuracion inicial solo contemplara la API key.

## 12. Puntos abiertos para una siguiente fase

- definir si habra aprobaciones o estados de revision;
- definir permisos o roles de usuario;
- definir busquedas avanzadas en la biblioteca de imagenes;
- definir si las colecciones seran manuales, automaticas o ambas;
- definir metadatos adicionales por version, mas alla de prompt, imagen y fecha;
- definir exportaciones, formatos de entrega y uso en redes sociales.

## 13. Resultado esperado

El producto debe funcionar como un estudio creativo de imagenes con IA, donde el usuario pueda pasar de una idea inicial a un activo visual utilizable, manteniendo contexto, recursos, historial y organizacion en un solo sistema.
