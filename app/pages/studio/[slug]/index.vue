<script setup lang="ts">
import { requireStudioSlug } from '~/utils/studio-routing'

const route = useRoute()
const slug = requireStudioSlug(route)

await navigateTo(`/studio/${slug}/brief`)
</script>
