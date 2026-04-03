<template>
  <StudioConceptsPage />
</template>

<script setup lang="ts">
import type { StudioProjectResponse } from '../../../../shared/types/studio'

import StudioConceptsPage from '../concepts.vue'
import { requireStudioSlug } from '~/utils/studio-routing'

const route = useRoute()
const { setProject } = useStudioSession()
const slug = requireStudioSlug(route)

const response = await $fetch<StudioProjectResponse>(`/api/studio/projects/${slug}`)

setProject(response.project)
</script>
