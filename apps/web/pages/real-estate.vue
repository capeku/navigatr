<script setup lang="ts">
useSeoMeta({
  title: 'Real Estate Demo | Navigatr',
  description: 'Property listing showcase demonstrating map interactions with the Navigatr SDK'
})
</script>

<template>
  <div class="page">
    <div class="sidebar">
      <div class="header">
        <NuxtLink to="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <h1>Real Estate Demo</h1>
      </div>

      <div class="content">
        <p class="description">
          A property listing showcase demonstrating interactive map features.
          Click on the map or search for an address to add property listings with
          custom pin icons and images.
        </p>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <div class="feature-text">
              <strong>Address Search</strong>
              <span>Geocode addresses with autocomplete</span>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="feature-text">
              <strong>Map Click</strong>
              <span>Drop pins and reverse geocode</span>
            </div>
          </div>
          <div class="feature">
            <div class="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <div class="feature-text">
              <strong>Custom Markers</strong>
              <span>Upload custom pin icons</span>
            </div>
          </div>
        </div>

        <div class="code-example">
          <h3>SDK Usage</h3>
          <pre><code>// Click handler
map.onClick((location) => {
  addPropertyMarker(location)
})

// Reverse geocode
const address = await nav.reverseGeocode({
  lat: location.lat,
  lng: location.lng
})

// Custom marker
map.addMarker({
  lat: 5.6037,
  lng: -0.1870,
  iconHtml: '&lt;img src="icon.png" /&gt;'
})</code></pre>
        </div>
      </div>
    </div>

    <div class="demo-area">
      <RealEstateDemo />
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

.sidebar {
  width: 360px;
  min-width: 360px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  transition: all 0.2s;
}

.back-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--accent);
}

h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.content {
  padding: 24px;
  flex: 1;
}

.description {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 148, 0.1);
  border-radius: 8px;
  color: var(--accent);
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-text strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.feature-text span {
  font-size: 12px;
  color: var(--text-muted);
}

.code-example {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.code-example h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border);
}

.code-example pre {
  padding: 16px;
  margin: 0;
  overflow-x: auto;
}

.code-example code {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

.demo-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #0a0a0a;
}

@media (max-width: 1100px) {
  .page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: auto;
    max-height: 35vh;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .demo-area {
    min-height: 65vh;
    padding: 16px;
  }
}
</style>
