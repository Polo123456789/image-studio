<script setup lang="ts">
const route = useRoute()
const slug = typeof route.params.slug === 'string' ? route.params.slug : ''

if (!slug) {
  await navigateTo('/studio')
}
else {
  await navigateTo(`/studio/${slug}/brief`)
}
</script>
