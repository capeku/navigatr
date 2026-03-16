<template>
  <NuxtPage />
</template>

<style>
:root {
  --bg: #0A0A0F;
  --accent: #00FF94;
  --text: #ffffff;
  --text-muted: #888888;
  --card-bg: #111118;
  --border: #222230;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'IBM Plex Mono', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

h1, h2, h3 {
  font-family: 'Syne', sans-serif;
}
</style>
