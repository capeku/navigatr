<script setup lang="ts">
</script>

<template>
  <div class="container">
    <div class="panel">
      <div class="header">
        <h1 class="logo">Navigatr</h1>
        <p class="tagline">The open source Google Maps alternative.<br>Zero API keys. Zero cost.</p>
      </div>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="feature-content">
            <h3>Geocoding</h3>
            <p>Convert addresses to coordinates with Nominatim</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <div class="feature-content">
            <h3>Autocomplete</h3>
            <p>Address search suggestions with Photon</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="feature-content">
            <h3>Routing</h3>
            <p>Turn-by-turn directions with Valhalla</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <div class="feature-content">
            <h3>Maps</h3>
            <p>Interactive maps with OpenStreetMap tiles</p>
          </div>
        </div>
      </div>

      <div class="code-section">
        <CodeSnippet origin="Accra Mall" destination="Kotoka Airport" />
      </div>

      <div class="footer">
        <a href="https://github.com/anthropics/navigatr" target="_blank" class="github-link">
          View on GitHub
        </a>
      </div>
    </div>

    <div class="demo-panel">
      <RideShareDemo />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  min-height: 100vh;
}

.panel {
  width: 45%;
  min-width: 420px;
  padding: 48px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.demo-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #111118 100%);
  padding: 40px;
}

.header {
  margin-bottom: 48px;
}

.logo {
  font-size: 48px;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 16px;
}

.tagline {
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.6;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 48px;
}

.feature {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.feature-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 148, 0.1);
  border-radius: 10px;
  color: var(--accent);
  flex-shrink: 0;
}

.feature-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.feature-content p {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}

.code-section {
  margin-bottom: 48px;
}

.footer {
  margin-top: auto;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  padding: 12px 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
}

.github-link:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (max-width: 1000px) {
  .container {
    flex-direction: column;
  }

  .panel {
    width: 100%;
    min-width: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .demo-panel {
    padding: 40px 20px;
  }
}
</style>
