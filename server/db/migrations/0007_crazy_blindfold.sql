PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gemini_api_key` text,
	`concept_generator_prompt` text NOT NULL,
	`image_generator_prompt` text NOT NULL,
	`style_guide_reverse_engineering_prompt` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_app_settings`("id", "gemini_api_key", "concept_generator_prompt", "image_generator_prompt", "style_guide_reverse_engineering_prompt", "created_at", "updated_at")
SELECT
	"id",
	"gemini_api_key",
	"concept_generator_prompt",
	"image_generator_prompt",
	'Contexto: Actua como un experto en Brand Strategy y Prompt Engineering para modelos de IA generativa de imagenes. Tarea: analiza las imagenes adjuntas y la descripcion proporcionada para realizar una ingenieria inversa de su identidad visual. Tu objetivo es crear una Guia de Estilo Tecnica disenada para que un generador de imagenes pueda replicar la estetica de la marca con total consistencia. Restriccion de salida: entrega exclusivamente la guia de estilo siguiendo la estructura solicitada abajo. No incluyas introducciones, comentarios ni conclusiones. ESTRUCTURA DE LA GUIA DE ESTILO: 1. CONCEPTO ESTETICO CENTRAL: define en una frase el estilo. 2. PALETA CROMATICA (DNA COLOR): incluye Colores Dominantes y Atmosfera de Color. 3. COMPOSICION Y ENCUADRE: incluye Angulos de camara, Profundidad de campo y Espacio Negativo. 4. ILUMINACION Y TEXTURA: incluye Tipo de Luz y Acabado. 5. PROMPT MAESTRO (TEMPLATE): crea un prompt con placeholders [SUJETO] para usar en Nano Banana 2. 6. PROMPT NEGATIVO (LO QUE DEBE EVITAR): lista de elementos, colores o estilos que rompen la estetica de la marca. Responde en espanol claro y tecnico. Usa la descripcion solo como contexto adicional y no inventes elementos que no se sostengan en las referencias.',
	"created_at",
	"updated_at"
FROM `app_settings`;--> statement-breakpoint
DROP TABLE `app_settings`;--> statement-breakpoint
ALTER TABLE `__new_app_settings` RENAME TO `app_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
