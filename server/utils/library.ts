import type {
  LibraryCollectionItem,
  LibraryFolderItem,
  LibraryImageItem,
  LibraryImageVersion,
  LibraryResponse,
  StudioVariantMode
} from '../../shared/types/studio'

import { desc } from 'drizzle-orm'

import { db } from '../db/client'
import { studioProjects } from '../db/schema'
import { listStudioProjects, getStudioProjectBySlug } from './studio-projects'

function compareDatesDesc(left: string, right: string) {
  return new Date(right).getTime() - new Date(left).getTime()
}

function buildCollectionKeys(mode: StudioVariantMode, ratio: string) {
  return [
    mode === 'final' ? 'finales' : 'previews',
    `ratio:${ratio}`,
    mode === 'final' ? `entrega:${ratio}` : `revision:${ratio}`
  ]
}

function buildVersionLabel(mode: StudioVariantMode, ratio: string, index: number) {
  if (mode === 'final') {
    return index === 0 ? `${ratio} final actual` : `${ratio} final v${index + 1}`
  }

  return index === 0 ? `${ratio} preview actual` : `${ratio} preview v${index + 1}`
}

function mapProjectToLibraryImages(projectSlug: string): LibraryImageItem[] {
  const project = getStudioProjectBySlug(projectSlug)

  return project.concepts.flatMap((concept) => {
    return concept.formats
      .filter((format) => format.variants.length > 0)
      .map((format) => {
        const versions = [...format.variants]
          .sort((left, right) => compareDatesDesc(left.createdAt, right.createdAt))
          .map((variant, index): LibraryImageVersion => ({
            id: variant.id,
            label: buildVersionLabel(variant.mode, format.ratio, index),
            mode: variant.mode,
            prompt: variant.prompt,
            imageUrl: variant.imageUrl,
            createdAt: variant.createdAt
          }))

        const currentVersion = versions[0]

        return {
          id: `${project.slug}:${concept.id}:${format.ratio}`,
          name: `${concept.title} ${format.ratio}`,
          projectSlug: project.slug,
          projectName: project.brief.projectName,
          conceptId: concept.id,
          conceptTitle: concept.title,
          conceptSubtitle: concept.subtitle,
          ratio: format.ratio,
          approvedAt: concept.approvedAt,
          createdAt: versions[versions.length - 1]?.createdAt || project.createdAt,
          updatedAt: currentVersion?.createdAt || project.updatedAt,
          currentVersionId: currentVersion?.id || '',
          versions,
          collectionKeys: Array.from(new Set(versions.flatMap((version) => buildCollectionKeys(version.mode, format.ratio))))
        } satisfies LibraryImageItem
      })
  })
}

export function getLibraryData(): LibraryResponse {
  const projectRows = db.select()
    .from(studioProjects)
    .orderBy(desc(studioProjects.updatedAt), desc(studioProjects.id))
    .all()
  const projects = listStudioProjects()
  const images = projectRows.flatMap((project) => mapProjectToLibraryImages(project.slug))
    .sort((left, right) => compareDatesDesc(left.updatedAt, right.updatedAt))

  const imageCountByProjectSlug = new Map<string, number>()
  const coverByProjectSlug = new Map<string, string | null>()

  images.forEach((image) => {
    imageCountByProjectSlug.set(image.projectSlug, (imageCountByProjectSlug.get(image.projectSlug) || 0) + 1)

    if (!coverByProjectSlug.has(image.projectSlug)) {
      coverByProjectSlug.set(image.projectSlug, image.versions[0]?.imageUrl || null)
    }
  })

  const folders: LibraryFolderItem[] = projects.map((project) => ({
    id: project.slug,
    name: project.projectName,
    projectSlug: project.slug,
    imageCount: imageCountByProjectSlug.get(project.slug) || 0,
    updatedAt: project.updatedAt,
    coverImageUrl: coverByProjectSlug.get(project.slug) || null
  }))

  const collectionMap = new Map<string, LibraryCollectionItem>()

  images.forEach((image) => {
    image.collectionKeys.forEach((key) => {
      const current = collectionMap.get(key)

      if (current) {
        current.imageCount += 1
        return
      }

      collectionMap.set(key, {
        id: key,
        name: key,
        imageCount: 1
      })
    })
  })

  return {
    folders,
    collections: Array.from(collectionMap.values()).sort((left, right) => right.imageCount - left.imageCount || left.name.localeCompare(right.name)),
    images
  }
}
