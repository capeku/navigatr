export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,
  app: {
    head: {
      title: 'Navigatr — Open Source Maps SDK',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'The open source Google Maps alternative. Zero API keys. Zero cost.' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }
      ]
    }
  }
})
