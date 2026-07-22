import { createJiti } from 'jiti'
import { writeFileSync } from 'node:fs'

const jiti = createJiti(import.meta.url, { interopDefault: true })
const library = jiti('../server/utils/library.ts')

const firstPage = library.getLibraryData({ page: 1, pageSize: 40, sort: 'project' })
const secondPage = library.getLibraryData({ page: 2, pageSize: 40, sort: 'project' })
const promptSearch = library.getLibraryData({ query: 'aguja historica' })
const legacy = library.getLibraryData({ collection: 'previews-legado' })
const ratioCollection = firstPage.collections.find(collection => collection.id === 'ratio:1:1')
const detail = library.getLibraryImageDetail(1)

const result = JSON.stringify({
  firstIds: firstPage.images.map(image => image.id),
  secondIds: secondPage.images.map(image => image.id),
  totalImages: firstPage.pagination.totalImages,
  totalVersions: firstPage.totalVersions,
  folderImageCount: firstPage.folders[0]?.imageCount,
  ratioImageCount: ratioCollection?.imageCount,
  promptSearchIds: promptSearch.images.map(image => image.id),
  legacyIds: legacy.images.map(image => image.id),
  historicalCollectionKeys: detail.collectionKeys,
  detailVersionCount: detail.versions.length
})
if (process.env.TEST_RESULT_PATH) writeFileSync(process.env.TEST_RESULT_PATH, result)
else process.stdout.write(`${result}\n`)
