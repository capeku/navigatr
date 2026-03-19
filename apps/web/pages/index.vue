<script setup lang="ts">
const email = ref("");

const limitations = [
  {
    issue: "No caching layer",
    detail: "Same address queried twice = two API calls",
    status: "planned",
    solution: "Built-in memoization coming in v1.1",
  },
  {
    issue: "Single point of failure",
    detail: "Default services have no fallback URLs",
    status: "planned",
    solution: "Automatic failover to backup servers",
  },
  {
    issue: "No offline support",
    detail: "Requires internet for all operations",
    status: "exploring",
    solution: "Service worker + cached tiles",
  },
  {
    issue: "Limited error handling",
    detail: "Rate limits can fail silently",
    status: "planned",
    solution: "Retry logic with exponential backoff",
  },
];

const roadmap = [
  {
    version: "v1.1",
    title: "Reliability",
    items: ["Geocode caching", "Fallback URLs", "Retry logic", "Better errors"],
    status: "in-progress",
  },
  {
    version: "v1.2",
    title: "Performance",
    items: ["Tree-shaking", "Lazy loading", "Bundle analyzer", "Smaller footprint"],
    status: "planned",
  },
  {
    version: "v2.0",
    title: "Navigatr Server",
    items: ["Self-hosted package", "Docker one-liner", "All services bundled", "Regional data"],
    status: "planned",
  },
];

const features = [
  {
    topic: "Geocoding",
    text: "Turn any address into coordinates instantly",
    icon: `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>`,
    bg: "bg-red-100",
    color: "text-red-600",
  },
  {
    topic: "Search",
    text: "Autocomplete that works as you type, no key required",
    icon: `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>`,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    topic: "Routing",
    text: "Real road routing with live ETA and turn instructions",
    icon: `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>`,
    bg: "bg-green-100",
    color: "text-green-600",
  },
  {
    topic: "Rendering",
    text: "Smooth, beautiful maps that render everywhere",
    icon: `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>`,
    bg: "bg-purple-100",
    color: "text-purple-600",
  },
  {
    topic: "Styling",
    text: "Customisable Maps, style your map to match your brand",
    icon: `<svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z" /></svg>`,
    bg: "bg-orange-100",
    color: "text-orange-600",
  },
];

function handleSignup() {
  console.log("Signup:", email.value);
  email.value = "";
}
</script>

<template>
  <div class="px-12 pb-12 max-w-7xl mx-auto">
    <!-- Hero Section -->

    <div class="flex gap-20 items-start max-lg:flex-col max-lg:gap-12">
      <!-- Left Column -->
      <div class="flex-1 max-w-lg max-lg:max-w-none">
        <div class="mb-16 max-w-3xl">
          <h1
            class="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight"
          >
            The open source alternative to Google Maps
          </h1>
          <p class="text-xl text-gray-600 leading-relaxed">
            A free, open source maps SDK for developers. Built on OpenStreetMap,
            Valhalla, and MapLibre. No API keys. No billing surprises. Just maps
            that work.
          </p>
        </div>
        <!-- Features -->
        <section class="mb-10">
          <h2 class="text-xl font-bold mb-4">Features</h2>
          <ul class="flex flex-col gap-4">
            <li
              v-for="feature in features"
              :key="feature.text"
              class="flex items-start gap-4"
            >
              <span
                :class="[feature.bg, feature.color]"
                class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                v-html="feature.icon"
              ></span>
              <div class="pt-1">
                <span class="text-sm font-semibold text-gray-900 block">{{
                  feature.topic
                }}</span>
                <span class="text-sm text-gray-600 leading-relaxed">{{
                  feature.text
                }}</span>
              </div>
            </li>
          </ul>
        </section>

        <!-- Get Started -->
        <section class="mb-10">
          <h2 class="text-xl font-bold mb-4">Get Started</h2>
          <code
            class="block text-sm bg-gray-100 text-gray-900 px-4 py-3 rounded-lg mb-4 font-mono"
          >
            npm install @<span class="text-accent">navigatr</span>/web
          </code>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/docs"
              class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full bg-accent text-black hover:opacity-90 transition-opacity"
            >
              Playground
            </NuxtLink>
            <NuxtLink
              to="/api"
              class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full bg-gray-900 text-white hover:opacity-90 transition-opacity"
            >
              Documentation
            </NuxtLink>
            <a
              href="https://github.com/capeku/navigatr"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-full border border-gray-300 text-gray-900 hover:border-accent hover:text-accent transition-colors"
            >
              <svg
                class="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clip-rule="evenodd"
                />
              </svg>
              Star on GitHub
            </a>
          </div>
        </section>

        <!-- Newsletter -->
        <!-- <section class="mb-10">
          <h2 class="text-xl font-bold text-accent mb-4">Stay Updated</h2>
          <form
            class="flex max-w-sm max-md:flex-col max-md:gap-3"
            @submit.prevent="handleSignup"
          >
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              required
              class="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-l-full max-md:rounded-full bg-white text-gray-900 font-mono outline-none focus:border-accent"
            />
            <button
              type="submit"
              class="px-6 py-3 text-sm font-semibold rounded-r-full max-md:rounded-full bg-accent text-black border border-accent -ml-px max-md:ml-0 hover:opacity-90 transition-opacity"
            >
              Sign me up!
            </button>
          </form>
        </section> -->
      </div>

      <!-- Right Column - Mockup -->
      <div class="flex-1 flex justify-center items-start pt-5 max-lg:w-full">
        <RideShareDemo />
      </div>
    </div>

    <!-- Transparency Section -->
    <section class="mt-24 pt-16 border-t border-gray-200">
      <div class="text-center mb-12">
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          We believe in transparency
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Navigatr is a young project. Here's what we're still working on and
          where we're headed.
        </p>
      </div>

      <!-- Current Limitations -->
      <div class="mb-16">
        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-amber-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          Current Limitations
        </h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="item in limitations"
            :key="item.issue"
            class="bg-gray-50 rounded-lg p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-semibold text-gray-900">{{ item.issue }}</p>
                <p class="text-sm text-gray-600 mt-1">{{ item.detail }}</p>
              </div>
              <span
                :class="
                  item.status === 'planned'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                "
                class="text-xs font-medium px-2 py-1 rounded-full shrink-0"
              >
                {{ item.status === "planned" ? "Fix planned" : "Exploring" }}
              </span>
            </div>
            <p class="text-sm text-accent mt-2">{{ item.solution }}</p>
          </div>
        </div>
      </div>

      <!-- Roadmap -->
      <div class="mb-16">
        <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-accent"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          Roadmap
        </h3>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="release in roadmap"
            :key="release.version"
            class="border border-gray-200 rounded-lg p-5"
            :class="
              release.status === 'in-progress' ? 'border-accent bg-accent/5' : ''
            "
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg font-bold text-gray-900">{{
                release.version
              }}</span>
              <span
                v-if="release.status === 'in-progress'"
                class="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-black"
              >
                In Progress
              </span>
            </div>
            <p class="font-semibold text-gray-700 mb-3">{{ release.title }}</p>
            <ul class="space-y-1">
              <li
                v-for="item in release.items"
                :key="item"
                class="text-sm text-gray-600 flex items-center gap-2"
              >
                <span class="w-1 h-1 bg-gray-400 rounded-full"></span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Navigatr Cloud -->
      <div class="bg-gradient-to-br from-purple-50 via-white to-accent/10 rounded-2xl p-8 md:p-12 border border-purple-100">
        <div class="flex flex-col lg:flex-row items-center gap-10">
          <!-- Left: Content -->
          <div class="flex-1 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 mb-4">
              <span class="text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">Coming Soon</span>
            </div>
            <h3 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Navigatr Cloud
            </h3>
            <p class="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              Managed infrastructure with <span class="font-semibold text-gray-900">capacity-based pricing</span>. Pay for throughput (requests per second), not per request. No surprises, predictable costs.
            </p>
            <div class="grid sm:grid-cols-3 gap-4 mb-8">
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7" />
                  </svg>
                </div>
                <p class="font-semibold text-gray-900">Dedicated Instances</p>
                <p class="text-sm text-gray-500">Your own infrastructure</p>
              </div>
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <p class="font-semibold text-gray-900">99.9% Uptime SLA</p>
                <p class="text-sm text-gray-500">Enterprise reliability</p>
              </div>
              <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <p class="font-semibold text-gray-900">90% Cheaper</p>
                <p class="text-sm text-gray-500">vs Google Maps</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              Free tier always available. Self-host anytime with our open source Docker setup.
            </p>
          </div>
          <!-- Right: Illustration -->
          <div class="flex-shrink-0 w-full lg:w-auto">
            <div class="relative w-64 h-64 mx-auto">
              <!-- Server rack illustration -->
              <div class="absolute inset-0 bg-gradient-to-br from-purple-100 to-accent/20 rounded-2xl"></div>
              <div class="absolute inset-4 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-3">
                <!-- Server rows -->
                <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <div class="flex-1 h-2 bg-gray-200 rounded"></div>
                  <div class="w-8 h-2 bg-accent/30 rounded"></div>
                </div>
                <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <div class="flex-1 h-2 bg-gray-200 rounded"></div>
                  <div class="w-8 h-2 bg-accent/30 rounded"></div>
                </div>
                <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <div class="flex-1 h-2 bg-gray-200 rounded"></div>
                  <div class="w-8 h-2 bg-accent/30 rounded"></div>
                </div>
                <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                  <div class="flex-1 h-2 bg-gray-200 rounded"></div>
                  <div class="w-8 h-2 bg-purple-200 rounded"></div>
                </div>
                <!-- Stats -->
                <div class="mt-auto pt-2 border-t border-gray-100">
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-400">Capacity</span>
                    <span class="font-mono font-semibold text-accent">50 req/s</span>
                  </div>
                  <div class="flex justify-between text-xs mt-1">
                    <span class="text-gray-400">Status</span>
                    <span class="font-semibold text-green-500">Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
