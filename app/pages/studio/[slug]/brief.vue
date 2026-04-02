<template>
  <StudioBriefPage />
</template>

<script setup lang="ts">
import type { StudioProjectResponse } from '../../../../shared/types/studio'

import StudioBriefPage from '../index.vue'

const route = useRoute()
const { setProject } = useStudioSession()
const slug = typeof route.params.slug === 'string' ? route.params.slug : ''

if (!slug) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Project slug is required'
  })
}

const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${slug}`)

setProject(response.project)
</script>
