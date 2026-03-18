<script setup lang="ts">
</script>

<template>
  <header class="sticky top-0 z-50 bg-background flex items-center justify-between px-12 py-6 w-full">
    <NuxtLink to="/" class="font-display text-2xl font-bold text-accent underline underline-offset-4">
      Navigatr
    </NuxtLink>
    <nav class="flex gap-12">
      <NuxtLink to="/docs" class="text-sm text-gray-900 hover:text-accent transition-colors">
        Playground
      </NuxtLink>
      <NuxtLink to="/api" class="text-sm text-gray-900 hover:text-accent transition-colors">
        Documentation
      </NuxtLink>
    </nav>
  </header>
</template>
