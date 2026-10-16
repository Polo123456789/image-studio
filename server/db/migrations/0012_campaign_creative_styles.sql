-- Actualiza solo estilos de fábrica sin descripciones ni referencias personalizadas.
-- Conserva IDs e historial; los estilos retirados se pueden reactivar en Configuración.
UPDATE creative_styles
SET description = 'Fotografía de producto sobre fondo limpio, luz suave y empaque legible. Ideal para mostrar fórmulas, presentaciones, disponibilidad y surtido; el producto lleva el peso visual.', position = 0, updated_at = unixepoch()
WHERE name = 'Packshot'
  AND description = 'Producto protagonista, fondo limpio, lectura comercial inmediata y foco total en forma, material y branding.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Fotografía natural de mascotas en casa, paseo o actividad, con sus personas cuando aporte al mensaje. La interacción y el entorno comunican bienestar, cuidado o uso cotidiano; integra el producto con escala y presencia creíbles.', position = 1, updated_at = unixepoch()
WHERE name = 'Estilo de vida'
  AND description = 'Producto integrado en una escena cotidiana aspiracional, con contexto humano o ambiental y atmosfera natural.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 12, updated_at = unixepoch()
WHERE name = 'Macro y detalle'
  AND description = 'Encuadres cerrados para destacar textura, acabado, materialidad, gotas, brillos o pequeños rasgos diferenciales.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Ilustración plana de mascotas, objetos y escenas con formas simples, contornos definidos y sombras mínimas. Una idea visual central para explicar situaciones de cuidado o servicios; paleta de marca y texto breve.', position = 10, updated_at = unixepoch()
WHERE name = 'Flat Design'
  AND description = 'Lenguaje grafico plano, formas limpias, sombras minimas y composicion clara con lectura simple y moderna.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 13, updated_at = unixepoch()
WHERE name = 'Ilustracion isometrica'
  AND description = 'Escena ilustrada en perspectiva isometrica, ordenada, tecnica y util para explicar producto, sistema o servicio.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Gráfica comercial enérgica con colores vivos de la marca, formas planas y tipografía contundente. Combina producto o mascota con recursos pop que refuercen el mensaje y una jerarquía clara; adecuado para promociones y campañas lúdicas.', position = 3, updated_at = unixepoch()
WHERE name = 'Pop Art'
  AND description = 'Color vibrante, alto contraste, energia grafica, irreverencia visual y recursos expresivos muy notorios.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Una imagen o producto principal, fondo despejado, pocos colores de marca y texto breve con jerarquía clara. Adecuado para comunicar un beneficio, disponibilidad o un recordatorio con lectura inmediata.', position = 5, updated_at = unixepoch()
WHERE name = 'Minimalismo'
  AND description = 'Pocos elementos, mucho aire, composicion contenida, jerarquia clara y una direccion elegante y sobria.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 14, updated_at = unixepoch()
WHERE name = 'Brutalismo'
  AND description = 'Impacto visual crudo, contrastes duros, composicion desafiante, tension grafica y presencia frontal.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 15, updated_at = unixepoch()
WHERE name = 'Editorial'
  AND description = 'Direccion de arte inspirada en revistas premium, composicion refinada, ritmo visual y sensibilidad de moda.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Fotografía publicitaria de producto a gran escala, perspectiva marcada e iluminación que define volumen y empaque. Ideal para lanzamientos o destacar una presentación; pocos elementos de apoyo y espacio para un titular breve.', position = 4, updated_at = unixepoch()
WHERE name = 'Hero shot'
  AND description = 'Producto heroico y dominante, angulo dramatico, iluminacion protagonista y sensacion de lanzamiento o hito.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Fotografía cenital de productos y accesorios organizados con separación clara. Ideal para combos, kits, regalos y variedad de presentaciones; mantiene legibles los empaques y la relación entre los elementos de la oferta.', position = 6, updated_at = unixepoch()
WHERE name = 'Flat lay'
  AND description = 'Vista cenital cuidadosamente ordenada, ideal para storytelling de accesorios, ingredientes o kits.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Fotografía de producto en una composición de estudio con bases, superficies y elementos de apoyo vinculados al mensaje. Luz suave, sombras naturales y color de marca; útil para aromas, cuidado e higiene sin saturar la escena.', position = 7, updated_at = unixepoch()
WHERE name = 'Bodegon contemporaneo'
  AND description = 'Naturaleza muerta publicitaria con props, balance escultorico y sensacion curada de estudio actual.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 16, updated_at = unixepoch()
WHERE name = 'High key'
  AND description = 'Escena luminosa, clara y optimista, con sombras suaves y predominio de blancos o tonos muy livianos.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 17, updated_at = unixepoch()
WHERE name = 'Low key cinematografico'
  AND description = 'Luz dramatica, fondos oscuros, profundidad atmosferica y una sensacion mas intensa o sofisticada.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET description = 'Fotografías recortadas de mascotas y productos combinadas con formas gráficas y tipografía de marca. Capas ordenadas, foco reconocible y energía lúdica; adecuado para tiendas de mascotas, novedades y promociones.', position = 11, updated_at = unixepoch()
WHERE name = 'Collage mixed media'
  AND description = 'Mezcla de fotografia, ilustracion, recortes y capas graficas para una pieza expresiva y menos literal.'
  AND reference_image_path IS NULL;
--> statement-breakpoint
UPDATE creative_styles
SET is_active = 0, position = 18, updated_at = unixepoch()
WHERE name = 'Futurista 3D'
  AND description = 'Materiales digitales, volumen sintético, iluminacion artificial pulida y lenguaje visual de innovacion.'
  AND reference_image_path IS NULL;
