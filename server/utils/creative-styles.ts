import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import type {
	CreativeStyleInput,
	CreativeStyleRecord,
	CreativeStylesResponse,
} from "../../shared/types/creative-styles";
import { db } from "../db/client";
import { creativeStyles } from "../db/schema";
import {
	resolvePathInsideDirectory,
	uploadsRootDirectory,
} from "./storage-paths";

export const creativeStyleReferencesDirectory = resolve(
	uploadsRootDirectory,
	"creative-styles",
);
const supportedCreativeStyleMimeTypes = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);
const defaultCreativeStyles = [
	{
		name: "Packshot",
		description:
			"Fotografía de producto sobre fondo limpio, luz suave y empaque legible. Ideal para mostrar fórmulas, presentaciones, disponibilidad y surtido; el producto lleva el peso visual.",
	},
	{
		name: "Estilo de vida",
		description:
			"Fotografía natural de mascotas en casa, paseo o actividad, con sus personas cuando aporte al mensaje. La interacción y el entorno comunican bienestar, cuidado o uso cotidiano; integra el producto con escala y presencia creíbles.",
	},
	{
		name: "Promoción tipográfica",
		description:
			"El precio, porcentaje o mecánica de la oferta domina mediante tipografía grande y alto contraste. Productos en segundo nivel, marca reconocible y condiciones legibles. Ideal para descuentos, combos, regalos y cierres de promoción; utiliza únicamente los datos del brief.",
	},
	{
		name: "Pop Art",
		description:
			"Gráfica comercial enérgica con colores vivos de la marca, formas planas y tipografía contundente. Combina producto o mascota con recursos pop que refuercen el mensaje y una jerarquía clara; adecuado para promociones y campañas lúdicas.",
	},
	{
		name: "Hero shot",
		description:
			"Fotografía publicitaria de producto a gran escala, perspectiva marcada e iluminación que define volumen y empaque. Ideal para lanzamientos o destacar una presentación; pocos elementos de apoyo y espacio para un titular breve.",
	},
	{
		name: "Minimalismo",
		description:
			"Una imagen o producto principal, fondo despejado, pocos colores de marca y texto breve con jerarquía clara. Adecuado para comunicar un beneficio, disponibilidad o un recordatorio con lectura inmediata.",
	},
	{
		name: "Flat lay",
		description:
			"Fotografía cenital de productos y accesorios organizados con separación clara. Ideal para combos, kits, regalos y variedad de presentaciones; mantiene legibles los empaques y la relación entre los elementos de la oferta.",
	},
	{
		name: "Bodegon contemporaneo",
		description:
			"Fotografía de producto en una composición de estudio con bases, superficies y elementos de apoyo vinculados al mensaje. Luz suave, sombras naturales y color de marca; útil para aromas, cuidado e higiene sin saturar la escena.",
	},
	{
		name: "Retrato de mascota",
		description:
			"Fotografía expresiva de perro o gato como protagonista, con encuadre cercano o de cuerpo completo y fondo sencillo. La mirada, postura y pelaje transmiten cercanía; adecuada para adopción, comunidad y mensajes de cuidado, con espacio para texto y marca.",
	},
	{
		name: "Infografía editorial",
		description:
			"Composición informativa con titular, bloques breves e iconos o ilustraciones planas que ordenan pasos, fechas, comparaciones o consejos. Fondo claro, paleta acotada y lectura cómoda en móvil; utiliza solo la información aportada, sin inventar recomendaciones de salud.",
	},
	{
		name: "Flat Design",
		description:
			"Ilustración plana de mascotas, objetos y escenas con formas simples, contornos definidos y sombras mínimas. Una idea visual central para explicar situaciones de cuidado o servicios; paleta de marca y texto breve.",
	},
	{
		name: "Collage mixed media",
		description:
			"Fotografías recortadas de mascotas y productos combinadas con formas gráficas y tipografía de marca. Capas ordenadas, foco reconocible y energía lúdica; adecuado para tiendas de mascotas, novedades y promociones.",
	},
] as const;

function toIsoString(value: Date) {
	return value.toISOString();
}

function slugifyFilePart(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w.-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
}

function getCreativeStyleReferenceExtension(
	fileName: string,
	mimeType: string,
) {
	const existingExtension = extname(fileName).toLowerCase();

	if (existingExtension) {
		return existingExtension;
	}

	if (mimeType === "image/png") return ".png";
	if (mimeType === "image/webp") return ".webp";
	if (mimeType === "image/gif") return ".gif";

	return ".jpg";
}

function getCreativeStyleReferenceUrl(storedFileName: string) {
	return `/uploads/creative-styles/${storedFileName}`;
}

export function resolveCreativeStyleReferencePath(fileUrl: string) {
	const prefix = "/uploads/creative-styles/";
	const resolvedPath = fileUrl.startsWith(prefix)
		? resolvePathInsideDirectory(
			creativeStyleReferencesDirectory,
			fileUrl.slice(prefix.length),
		)
		: null;

	if (!resolvedPath) {
		throw createError({
			statusCode: 404,
			statusMessage: "Imagen de referencia no encontrada.",
		});
	}

	return resolvedPath;
}

function normalizeCreativeStyleRecord(
	record: typeof creativeStyles.$inferSelect,
): CreativeStyleRecord {
	return {
		id: record.id,
		name: record.name,
		description: record.description,
		referenceImageUrl: record.referenceImagePath,
		position: record.position,
		isActive: record.isActive,
		createdAt: toIsoString(record.createdAt),
		updatedAt: toIsoString(record.updatedAt),
	};
}

function normalizeCreativeStyleInput(
	payload: CreativeStyleInput,
): CreativeStyleInput {
	return {
		name: payload.name.trim(),
		description: payload.description.trim(),
		position:
			typeof payload.position === "number" && Number.isFinite(payload.position)
				? Math.max(0, Math.floor(payload.position))
				: undefined,
		isActive: Boolean(payload.isActive),
	};
}

function ensureCreativeStyleName(name: string, existingId?: number) {
	if (!name) {
		throw createError({
			statusCode: 400,
			statusMessage: "El nombre del estilo es obligatorio.",
		});
	}

	const existing = db.query.creativeStyles
		.findFirst({
			where: eq(creativeStyles.name, name),
		})
		.sync();

	if (existing && existing.id !== existingId) {
		throw createError({
			statusCode: 409,
			statusMessage: "Ya existe un estilo creativo con ese nombre.",
		});
	}
}

function getCreativeStyleRowById(id: number) {
	const style = db.query.creativeStyles
		.findFirst({
			where: eq(creativeStyles.id, id),
		})
		.sync();

	if (!style) {
		throw createError({
			statusCode: 404,
			statusMessage: "Creative style not found",
		});
	}

	return style;
}

function getNextCreativeStylePosition() {
	const rows = db
		.select({ position: creativeStyles.position })
		.from(creativeStyles)
		.orderBy(asc(creativeStyles.position), asc(creativeStyles.id))
		.all();

	return rows.length ? rows[rows.length - 1]!.position + 1 : 0;
}

function ensureDefaultCreativeStyles() {
	const existingStyleNames = new Set(
		db
			.select({ name: creativeStyles.name })
			.from(creativeStyles)
			.all()
			.map((style) => style.name),
	);
	const missingDefaultStyles = defaultCreativeStyles.filter(
		(style) => !existingStyleNames.has(style.name),
	);

	if (!missingDefaultStyles.length) {
		return;
	}

	const now = new Date();

	db.transaction(() => {
		missingDefaultStyles.forEach((style) => {
			db.insert(creativeStyles)
				.values({
					name: style.name,
					description: style.description,
					position: defaultCreativeStyles.findIndex(
						(defaultStyle) => defaultStyle.name === style.name,
					),
					isActive: true,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoNothing({
					target: creativeStyles.name,
				})
				.run();
		});
	});
}

export function listCreativeStyles(): CreativeStylesResponse {
	ensureDefaultCreativeStyles();

	const rows = db
		.select()
		.from(creativeStyles)
		.orderBy(
			asc(creativeStyles.position),
			asc(creativeStyles.name),
			asc(creativeStyles.id),
		)
		.all();

	return {
		styles: rows.map(normalizeCreativeStyleRecord),
	};
}

export function getActiveCreativeStyles() {
	ensureDefaultCreativeStyles();

	return db
		.select()
		.from(creativeStyles)
		.where(eq(creativeStyles.isActive, true))
		.orderBy(
			asc(creativeStyles.position),
			asc(creativeStyles.name),
			asc(creativeStyles.id),
		)
		.all()
		.map(normalizeCreativeStyleRecord);
}

export function createCreativeStyle(payload: CreativeStyleInput) {
	const normalizedPayload = normalizeCreativeStyleInput(payload);

	ensureCreativeStyleName(normalizedPayload.name);

	const now = new Date();
	const result = db
		.insert(creativeStyles)
		.values({
			name: normalizedPayload.name,
			description: normalizedPayload.description,
			position: normalizedPayload.position ?? getNextCreativeStylePosition(),
			isActive: normalizedPayload.isActive,
			createdAt: now,
			updatedAt: now,
		})
		.returning({ id: creativeStyles.id })
		.get();

	return normalizeCreativeStyleRecord(getCreativeStyleRowById(result.id));
}

export function updateCreativeStyle(id: number, payload: CreativeStyleInput) {
	const style = getCreativeStyleRowById(id);
	const normalizedPayload = normalizeCreativeStyleInput(payload);

	ensureCreativeStyleName(normalizedPayload.name, style.id);

	db.update(creativeStyles)
		.set({
			name: normalizedPayload.name,
			description: normalizedPayload.description,
			position: normalizedPayload.position ?? style.position,
			isActive: normalizedPayload.isActive,
			updatedAt: new Date(),
		})
		.where(eq(creativeStyles.id, id))
		.run();

	return normalizeCreativeStyleRecord(getCreativeStyleRowById(id));
}

export async function deleteCreativeStyle(id: number) {
	const style = getCreativeStyleRowById(id);

	if (style.referenceImagePath) {
		try {
			await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath));
		} catch (error) {
			if (
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "ENOENT"
			) {
				throw error;
			}
		}
	}

	db.delete(creativeStyles).where(eq(creativeStyles.id, id)).run();
}

export async function uploadCreativeStyleReference(id: number, file: File) {
	const style = getCreativeStyleRowById(id);

	if (!file.size) {
		throw createError({
			statusCode: 400,
			statusMessage: "La imagen de referencia esta vacia.",
		});
	}

	if (!supportedCreativeStyleMimeTypes.has(file.type || "")) {
		throw createError({
			statusCode: 400,
			statusMessage: "La referencia debe ser JPG, PNG, WEBP o GIF.",
		});
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const fileNameBase = slugifyFilePart(style.name) || `style-${style.id}`;
	const storedFileName = `${fileNameBase}-${randomUUID()}${getCreativeStyleReferenceExtension(file.name || style.name, file.type)}`;
	const relativeFilePath = getCreativeStyleReferenceUrl(storedFileName);
	const absoluteFilePath = resolve(
		creativeStyleReferencesDirectory,
		storedFileName,
	);

	await mkdir(creativeStyleReferencesDirectory, { recursive: true });
	await writeFile(absoluteFilePath, buffer);

	db.update(creativeStyles)
		.set({
			referenceImagePath: relativeFilePath,
			updatedAt: new Date(),
		})
		.where(eq(creativeStyles.id, id))
		.run();

	if (style.referenceImagePath) {
		try {
			await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath));
		} catch (error) {
			if (
				!(error instanceof Error) ||
				!("code" in error) ||
				error.code !== "ENOENT"
			) {
				throw error;
			}
		}
	}

	return normalizeCreativeStyleRecord(getCreativeStyleRowById(id));
}

export async function deleteCreativeStyleReference(id: number) {
	const style = getCreativeStyleRowById(id);

	if (!style.referenceImagePath) {
		return normalizeCreativeStyleRecord(style);
	}

	db.update(creativeStyles)
		.set({
			referenceImagePath: null,
			updatedAt: new Date(),
		})
		.where(eq(creativeStyles.id, id))
		.run();

	try {
		await unlink(resolveCreativeStyleReferencePath(style.referenceImagePath));
	} catch (error) {
		if (
			!(error instanceof Error) ||
			!("code" in error) ||
			error.code !== "ENOENT"
		) {
			throw error;
		}
	}

	return normalizeCreativeStyleRecord(getCreativeStyleRowById(id));
}
