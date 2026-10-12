# Prompt del generador de conceptos

El nuevo prompt está en [`server/prompts/concept-generator.ts`](../server/prompts/concept-generator.ts). Sustituye el valor predeterminado de conceptos en `server/utils/settings.ts`. La investigación se consultó el 6 de septiembre de 2026.

## Qué corrige

El prompt anterior pedía `gemini3Prompt`, aunque la respuesta real usa `variantPrompts`. También ordenaba analizar assets adjuntos. En `generateConceptSeeds`, el modelo recibe texto con sus metadatos; las imágenes se adjuntan después en `generateFinalImage`.

Además, cada formato se genera por separado. El generador de imágenes recibe su prompt y los assets, pero no recibe los campos `title`, `subtitle` o `rationale`, ni la guía completa. El nuevo prompt exige trasladar las decisiones necesarias a cada entrada de `variantPrompts`.

La diversidad deja de depender de pedir conceptos "distintos". Ahora se diferencia una idea visual de una variación de color o estilo. Cuando el cliente ya fijó el concepto, se exploran ejecuciones dentro de ese límite.

## Investigación y decisiones

Estas fuentes sustentan las instrucciones generales. Su adaptación a Image Studio es una propuesta de diseño, no evidencia de que el nuevo prompt ya produzca mejores imágenes o anuncios con mayor conversión.

| Aspecto | Fuente y hallazgo | Aplicación en el prompt |
| --- | --- | --- |
| Escena y referencias | [Guía de Nano Banana de Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana). Recomienda describir la escena y aclarar cómo se relacionan las referencias con el resultado. | Sujeto, acción, entorno y composición definidos. Cada asset tiene una función y una instrucción de conservación. |
| Tipografía | [Guía de Nano Banana de Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana). Recomienda indicar el texto exacto entre comillas y describir su tipografía. | Texto visible separado de los metadatos del concepto, con ubicación, jerarquía y redacción consistente entre formatos. |
| Intención y control visual | [Buenas prácticas de generación de imágenes de Google](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/gemini-image-generation-best-practices). Recomienda proporcionar propósito y detalles concretos, describir el resultado deseado y dirigir la cámara cuando corresponda. | Decisiones visibles de encuadre, luz, materiales o trazo según el medio. Exclusiones breves y pertinentes. |
| Jerarquía visual | [Principios de diseño visual de Nielsen Norman Group](https://www.nngroup.com/articles/principles-visual-design/). Explica cómo escala, contraste, equilibrio y agrupación orientan la lectura. La fuente trata UX; aplicamos esos principios de composición a las piezas publicitarias. | Foco principal, orden de lectura, separación de elementos y contraste. Recomposición según el lienzo. |
| Instrucciones y formato | [Estrategias de prompting de Gemini](https://ai.google.dev/gemini-api/docs/prompting-strategies). Recomienda instrucciones específicas, restricciones claras y ejemplos; para salidas complejas propone usar el esquema estructurado de la API. | Se conserva el esquema existente. Se aclara cada campo y se añaden dos ejemplos breves de criterio visual, sin imponer una campaña de muestra. |

Las reglas sobre datos comerciales, referencias que el modelo no ha visto, independencia entre formatos y precedencia de estilos salen del flujo de esta aplicación. La pauta de diversidad y la revisión antes de responder son hipótesis de mejora que deben contrastarse con generaciones reales.

## Compatibilidad con la aplicación

- Se mantiene el array de `StudioConceptSeed` y los campos existentes. No se modifican modelos, esquema JSON, generación de imágenes ni persistencia.
- `creativeStyleId` debe ser entero en el esquema actual. El prompt usa `0` cuando no corresponde una selección, valor que `normalizeCreativeStyleSelection` normaliza a `null`. Con guía aplicada, el nombre queda vacío. Con estilo fijo o seleccionado, devuelve su ID y nombre.
- La instrucción dinámica de estilo fijo ahora incluye su ID, igual que las entradas de la biblioteca. El modelo dispone así del dato que debe devolver.
- La política de texto se alinea con el prompt de imágenes predeterminado: texto publicitario añadido solo cuando el brief lo pide. Los rótulos que ya pertenecen a un asset se conservan.
- El prompt sigue en español y no depende de una versión comercial concreta de Gemini. Los ejemplos ilustran criterios; no aportan hechos, ofertas ni assets a la campaña.

## Cómo probarlo en una instalación existente

Los valores guardados en `app_settings.concept_generator_prompt` tienen prioridad sobre el predeterminado. Fusionar y desplegar este cambio no reemplaza un prompt guardado, incluso si coincide con el predeterminado anterior. El cambio se aplica directamente cuando no hay valor persistido.

1. Copia el prompt actual de Configuración → Generador de conceptos para poder recuperarlo.
2. En este checkout, imprime el nuevo texto con Bun:

   ```sh
   bun -e "import { defaultConceptGeneratorPrompt } from './server/prompts/concept-generator.ts'; console.log(defaultConceptGeneratorPrompt)"
   ```

3. Pega ese texto en Generador de conceptos y guarda la configuración. Conserva los otros prompts para que la comparación cambie una sola variable.
4. Genera conceptos nuevos. Los conceptos y prompts de formato ya guardados conservan su contenido. Para volver al anterior, pega la copia y guarda.

## Comparación propuesta

Usa proyectos de prueba con los mismos briefs, assets, guías, modelos, resolución y ratios para ambos prompts. Haz al menos dos tandas de tres conceptos por caso y revisa los resultados sin mostrar cuál prompt los produjo. Registra también tiempo y consumo de tokens. Esta pauta es una comprobación práctica inicial, no una prueba estadística.

| Caso | Brief de prueba y controles | Qué revisar |
| --- | --- | --- |
| Concepto abierto | Modo guiado. Anunciar una botella reutilizable para acompañar el trayecto al trabajo. Acción: conocer el producto. Sin oferta ni copy solicitado. Sin guía ni estilo fijo. Ratios `1:1`, `9:16`, `16:9`. | Las tres ideas se distinguen por su situación o mecanismo visual; no aparecen beneficios técnicos, precios ni titulares inventados. |
| Concepto ya fijado | Modo plano. "Desarrolla la idea de un objeto cotidiano convertido en refugio de lectura. Todas las propuestas deben conservar esta idea. Sin texto". Ratios `1:1`, `9:16`. | Hay ejecuciones distintas dentro del concepto pedido. No sustituye la idea para cumplir la regla de diversidad. |
| Copy obligatorio | Modo plano. "Crea un cartel de lectura. Incluye exactamente: 'Tarde de lectura', '12 de septiembre', 'Entrada libre'. No añadas otros textos". Ratios `1:1`, `9:16`, `16:9`. | Los prompts conservan las tres cadenas, sus acentos y su jerarquía. En las imágenes, revisar legibilidad, omisiones y texto extra. |
| Marca y múltiples referencias | Seleccionar un producto, un logo y una referencia visual reales de prueba. Pedir producto protagonista, logo secundario y usar la tercera imagen solo como referencia estética. Aplicar una guía disponible y un ajuste puntual de color. | Cada referencia tiene un papel concreto. Se respeta la guía salvo el ajuste indicado. No se describe como observado un detalle ausente de los metadatos. No se dibuja la referencia estética como objeto. |
| Estilo fijo | Repetir el primer caso con un estilo activo fijado y sin guía. | Todas las propuestas respetan el estilo; se diferencian por la idea. El ID y nombre coinciden con la selección. |
| Biblioteca vacía y datos incompletos | Sin guía, estilo ni assets. Modo plano. "Anuncia una próxima actividad de lectura. Fecha y lugar por confirmar. No incluyas texto". Ratio `4:5`. | Devuelve una dirección visual concreta, ID `0` y nombre descriptivo. No inventa fecha, lugar, logo ni referencias. Expone una ausencia esencial en rationale solo si afecta la propuesta. |

En cada caso, verifica primero el contrato: cantidad exacta de conceptos, campos existentes, ratios completos, IDs válidos y prompts que se entiendan por separado. Después compara fidelidad al brief, diversidad, claridad visual, uso de assets, texto y adaptación por formato.

Puntúa cada criterio aplicable con `0` si falla, `1` si exige una corrección sustancial y `2` si sirve para generar o revisar el arte sin rehacer el concepto. Un dato comercial inventado, texto obligatorio alterado o referencia inexistente invalida esa propuesta aunque sea atractiva. Examina las imágenes además del texto; aprobar el JSON no demuestra calidad visual.

## Alcance de la validación

Las comprobaciones de código verifican integración y compilación. No sustituyen la comparación anterior. Este cambio no incluye resultados A/B de Gemini ni una afirmación de mejora visual medida. La longitud adicional del prompt aumenta los tokens de entrada; conviene contrastar ese coste con la reducción de correcciones al probarlo.
