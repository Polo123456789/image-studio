import type { LibraryResponse } from '../../../shared/types/studio'

import { getLibraryData } from '../../utils/library'

export default defineEventHandler((event): LibraryResponse => {
  const query = getQuery(event)
  return getLibraryData({
    page: Number(query.page),
    pageSize: Number(query.pageSize),
    folder: typeof query.folder === 'string' ? query.folder : undefined,
    collection: typeof query.collection === 'string' ? query.collection : undefined,
    query: typeof query.q === 'string' ? query.q.slice(0, 200) : undefined,
    sort: query.sort === 'versions' || query.sort === 'project' ? query.sort : 'recent'
  })
})
