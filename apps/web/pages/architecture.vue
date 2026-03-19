<script setup lang="ts">
const activeSection = ref("overview");

const sections = [
  { id: "overview", label: "Overview" },
  { id: "distributed", label: "Distributed Architecture" },
  { id: "comparison", label: "vs Google Maps" },
  { id: "self-hosted", label: "Self-Hosted" },
  { id: "migration", label: "Migration Path" },
  { id: "data-flow", label: "Data Flow" },
];

function scrollToSection(id: string) {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    { rootMargin: "-100px 0px -80% 0px" },
  );

  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  return () => observer.disconnect();
});
</script>

<template>
  <div class="flex bg-background">
    <!-- Sidebar Navigation -->
    <nav
      class="hidden md:block w-56 p-6 border-r border-gray-200 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto shrink-0"
    >
      <div class="flex flex-col gap-1">
        <button
          v-for="section in sections"
          :key="section.id"
          class="px-3 py-2.5 rounded-lg text-sm text-left transition-all"
          :class="
            activeSection === section.id
              ? 'bg-accent/50 text-accent'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          "
          @click="scrollToSection(section.id)"
        >
          {{ section.label }}
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 p-12 max-w-4xl">
      <!-- Overview -->
      <section id="overview" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Navigatr Architecture
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Navigatr is designed as a <strong class="text-gray-900">distributed client-side SDK</strong>.
          API calls are made directly from users' browsers to public infrastructure, eliminating
          the need for your own backend and avoiding centralized billing.
        </p>

        <div class="bg-gradient-to-br from-accent/10 to-purple-50 border border-accent/20 rounded-xl p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Key Principles</h3>
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">Client-Side SDK</p>
                <p class="text-xs text-gray-500">Runs entirely in the browser</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">Direct Requests</p>
                <p class="text-xs text-gray-500">Users call APIs directly</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">Distributed Load</p>
                <p class="text-xs text-gray-500">1000 users = 1000 IPs</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900 text-sm">Zero Cost</p>
                <p class="text-xs text-gray-500">No API keys or billing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Distributed Architecture -->
      <section id="distributed" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Distributed Public Infrastructure
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Each user's browser makes API calls directly to public services. No backend required for your app.
        </p>

        <!-- Architecture Diagram -->
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 overflow-x-auto">
          <pre class="font-mono text-xs text-gray-300 leading-relaxed"><code>    <span class="text-cyan-400">YOUR APP</span>                                    <span class="text-green-400">PUBLIC INFRASTRUCTURE</span>
                                             <span class="text-gray-500">(Community-funded, free to use)</span>

┌──────────────────┐
│   <span class="text-purple-400">User A</span>         │
│   Browser        │───┐
│ ┌──────────────┐ │   │
│ │ @navigatr/web│ │   │
│ └──────────────┘ │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │      ┌─────────────────────────────────────────────┐
│   <span class="text-purple-400">User B</span>         │   │      │                                             │
│   Browser        │───┼─────▶│  ┌─────────────┐    <span class="text-blue-400">Routing</span>                 │
│ ┌──────────────┐ │   │      │  │  <span class="text-yellow-300">Valhalla</span>   │    valhalla1.openstreetmap.de
│ │ @navigatr/web│ │   │      │  └─────────────┘                            │
│ └──────────────┘ │   │      │                                             │
└──────────────────┘   │      │  ┌─────────────┐    <span class="text-blue-400">Geocoding</span>               │
                       ├─────▶│  │  <span class="text-yellow-300">Nominatim</span>  │    nominatim.openstreetmap.org
┌──────────────────┐   │      │  └─────────────┘                            │
│   <span class="text-purple-400">User C</span>         │   │      │                                             │
│   Browser        │───┤      │  ┌─────────────┐    <span class="text-blue-400">Autocomplete</span>            │
│ ┌──────────────┐ │   │      │  │   <span class="text-yellow-300">Photon</span>    │    photon.komoot.io        │
│ │ @navigatr/web│ │   │      │  └─────────────┘                            │
│ └──────────────┘ │   │      │                                             │
└──────────────────┘   │      │  ┌─────────────┐    <span class="text-blue-400">Map Tiles</span>               │
                       │      │  │ <span class="text-yellow-300">OpenFreeMap</span> │    tiles.openfreemap.org   │
┌──────────────────┐   │      │  └─────────────┘                            │
│   <span class="text-purple-400">User N</span>         │───┘      │                                             │
│   Browser        │          └─────────────────────────────────────────────┘
└──────────────────┘</code></pre>
        </div>

        <!-- Why This Works -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Why This Works</h3>
        <div class="overflow-x-auto mb-8">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Aspect</th>
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Benefit</th>
              </tr>
            </thead>
            <tbody class="text-gray-900">
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">IP Distribution</td>
                <td class="py-3 px-4 text-gray-500">Requests come from users' IPs, not a single server</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Policy Compliance</td>
                <td class="py-3 px-4 text-gray-500">Matches intended usage of public OSM infrastructure</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">No Rate Limiting</td>
                <td class="py-3 px-4 text-gray-500">Each user has their own rate limit quota</td>
              </tr>
              <tr>
                <td class="py-3 px-4 font-medium">Zero Infrastructure</td>
                <td class="py-3 px-4 text-gray-500">No servers to deploy, scale, or pay for</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Comparison -->
      <section id="comparison" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Traditional vs Navigatr
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          See how Navigatr's distributed architecture compares to traditional centralized approaches like Google Maps.
        </p>

        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <!-- Google Maps -->
          <div class="border border-red-200 bg-red-50/50 rounded-xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <h3 class="font-semibold text-gray-900">Google Maps (Centralized)</h3>
            </div>
            <div class="bg-gray-900 rounded-lg p-4 mb-4">
              <pre class="font-mono text-xs text-gray-300"><code>User A ──┐
User B ──┼──▶ <span class="text-yellow-300">Your Server</span> ──▶ Google
User C ──┤        │
User N ──┘        ▼
               <span class="text-red-400">$$$$ Bill</span></code></pre>
            </div>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                All requests via your API key
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Billed per request
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Single point of failure
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                You pay for all users
              </li>
            </ul>
          </div>

          <!-- Navigatr -->
          <div class="border border-accent/30 bg-accent/5 rounded-xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-5 h-5 rounded bg-accent flex items-center justify-center">
                <span class="text-black text-xs font-bold">N</span>
              </div>
              <h3 class="font-semibold text-gray-900">Navigatr (Distributed)</h3>
            </div>
            <div class="bg-gray-900 rounded-lg p-4 mb-4">
              <pre class="font-mono text-xs text-gray-300"><code>User A ────▶ <span class="text-green-400">Public APIs</span>
User B ────▶ <span class="text-green-400">Public APIs</span>
User C ────▶ <span class="text-green-400">Public APIs</span>
User N ────▶ <span class="text-green-400">Public APIs</span></code></pre>
            </div>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Direct browser requests
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                No API key needed
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Distributed load
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Community-funded infra
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Self-Hosted -->
      <section id="self-hosted" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Self-Hosted Navigatr Server
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          For production applications with high traffic or specific requirements (privacy, SLA, custom regions),
          deploy your own Navigatr Server.
        </p>

        <!-- Self-Hosted Diagram -->
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 overflow-x-auto">
          <pre class="font-mono text-xs text-gray-300 leading-relaxed"><code>    <span class="text-cyan-400">YOUR USERS</span>                              <span class="text-green-400">YOUR NAVIGATR SERVER</span>
                                           <span class="text-gray-500">(Single deployment, all services)</span>

┌──────────────────┐                    ┌─────────────────────────────────────┐
│   <span class="text-purple-400">User A</span>         │                    │                                     │
│   Browser        │───┐                │  ┌───────────────────────────────┐  │
│ ┌──────────────┐ │   │                │  │      <span class="text-yellow-300">NAVIGATR SERVER</span>          │  │
│ │ @navigatr/web│ │   │                │  │                               │  │
│ └──────────────┘ │   │                │  │  ┌─────────┐  ┌─────────┐     │  │
└──────────────────┘   │                │  │  │<span class="text-blue-400">Valhalla</span> │  │<span class="text-blue-400">Nominatim</span>│     │  │
                       │                │  │  │ Routing │  │Geocoding│     │  │
┌──────────────────┐   │                │  │  └─────────┘  └─────────┘     │  │
│   <span class="text-purple-400">User B</span>         │   │                │  │                               │  │
│   Browser        │───┼───────────────▶│  │  ┌─────────┐  ┌─────────┐     │  │
│ ┌──────────────┐ │   │                │  │  │ <span class="text-blue-400">Photon</span>  │  │  <span class="text-blue-400">Tile</span>   │     │  │
│ │ @navigatr/web│ │   │                │  │  │Autocomp.│  │ Server  │     │  │
│ └──────────────┘ │   │                │  │  └─────────┘  └─────────┘     │  │
└──────────────────┘   │                │  │                               │  │
                       │                │  │  ┌─────────────────────────┐  │  │
┌──────────────────┐   │                │  │  │     <span class="text-orange-400">OSM Data (PBF)</span>      │  │  │
│   <span class="text-purple-400">User N</span>         │───┘                │  │  │  Regional or Global     │  │  │
│   Browser        │                    │  │  └─────────────────────────┘  │  │
└──────────────────┘                    │  └───────────────────────────────┘  │
                                        │  <span class="text-accent">maps.yourcompany.com</span>               │
                                        └─────────────────────────────────────┘</code></pre>
        </div>

        <!-- Benefits Table -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Self-Hosted Benefits</h3>
        <div class="overflow-x-auto mb-8">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Benefit</th>
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Description</th>
              </tr>
            </thead>
            <tbody class="text-gray-900">
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Unlimited Requests</td>
                <td class="py-3 px-4 text-gray-500">No rate limits, scale as needed</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Privacy</td>
                <td class="py-3 px-4 text-gray-500">User queries never leave your infrastructure</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Custom Regions</td>
                <td class="py-3 px-4 text-gray-500">Load only the map data you need (country, continent)</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">SLA Control</td>
                <td class="py-3 px-4 text-gray-500">Your uptime, your guarantees</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Offline Support</td>
                <td class="py-3 px-4 text-gray-500">Works without internet for internal apps</td>
              </tr>
              <tr>
                <td class="py-3 px-4 font-medium">Custom Data</td>
                <td class="py-3 px-4 text-gray-500">Add proprietary POIs, custom routing rules</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Server Components -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Server Components</h3>
        <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden mb-8">
          <pre class="p-4 overflow-x-auto"><code class="font-mono text-sm text-gray-100"><span class="text-cyan-400">navigatr-server/</span>
├── <span class="text-yellow-300">docker-compose.yml</span>       <span class="text-gray-500"># Single command deployment</span>
├── <span class="text-cyan-400">valhalla/</span>                <span class="text-gray-500"># Routing engine</span>
│   └── tiles/               <span class="text-gray-500"># Pre-built routing tiles</span>
├── <span class="text-cyan-400">nominatim/</span>               <span class="text-gray-500"># Geocoding service</span>
│   └── data/                <span class="text-gray-500"># Address database</span>
├── <span class="text-cyan-400">photon/</span>                  <span class="text-gray-500"># Autocomplete service</span>
│   └── elasticsearch/       <span class="text-gray-500"># Search index</span>
├── <span class="text-cyan-400">tileserver/</span>              <span class="text-gray-500"># Vector tile server</span>
│   └── mbtiles/             <span class="text-gray-500"># Map tile data</span>
└── <span class="text-cyan-400">nginx/</span>                   <span class="text-gray-500"># Reverse proxy</span>
    └── nginx.conf           <span class="text-gray-500"># Unified API endpoint</span></code></pre>
        </div>

        <!-- Deployment Options -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Deployment Options</h3>
        <div class="overflow-x-auto mb-8">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Option</th>
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Best For</th>
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Resources</th>
              </tr>
            </thead>
            <tbody class="text-gray-900">
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Single Region</td>
                <td class="py-3 px-4 text-gray-500">Country-level apps</td>
                <td class="py-3 px-4"><code class="text-xs bg-gray-100 px-2 py-1 rounded">8GB RAM, 50GB disk</code></td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4 font-medium">Continental</td>
                <td class="py-3 px-4 text-gray-500">Multi-country apps</td>
                <td class="py-3 px-4"><code class="text-xs bg-gray-100 px-2 py-1 rounded">32GB RAM, 200GB disk</code></td>
              </tr>
              <tr>
                <td class="py-3 px-4 font-medium">Global</td>
                <td class="py-3 px-4 text-gray-500">Worldwide coverage</td>
                <td class="py-3 px-4"><code class="text-xs bg-gray-100 px-2 py-1 rounded">64GB+ RAM, 500GB+ disk</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Client Configuration -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Client Configuration</h3>
        <div class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <pre class="p-4 overflow-x-auto"><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// Point to your self-hosted server</span>
<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">Navigatr</span>({
  <span class="text-cyan-300">serverUrl</span>: <span class="text-yellow-300">'https://maps.yourcompany.com'</span>
})

<span class="text-gray-500">// Or configure individual services</span>
<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">Navigatr</span>({
  <span class="text-cyan-300">valhallaUrl</span>: <span class="text-yellow-300">'https://maps.yourcompany.com/valhalla'</span>,
  <span class="text-cyan-300">nominatimUrl</span>: <span class="text-yellow-300">'https://maps.yourcompany.com/nominatim'</span>,
  <span class="text-cyan-300">photonUrl</span>: <span class="text-yellow-300">'https://maps.yourcompany.com/photon'</span>,
  <span class="text-cyan-300">tileUrl</span>: <span class="text-yellow-300">'https://maps.yourcompany.com/tiles'</span>
})</code></pre>
        </div>
      </section>

      <!-- Migration Path -->
      <section id="migration" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Migration Path
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Start with public infrastructure for free, then migrate to self-hosted as you scale.
        </p>

        <!-- Migration Diagram -->
        <div class="grid md:grid-cols-3 gap-4 mb-8">
          <div class="border border-gray-200 rounded-xl p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-accent font-bold">1</span>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Development</h4>
            <p class="text-sm text-gray-500 mb-4">Public APIs<br/>Free, instant</p>
            <code class="text-xs bg-gray-100 px-3 py-1.5 rounded-full">npm install @navigatr/web</code>
          </div>
          <div class="border border-gray-200 rounded-xl p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-accent font-bold">2</span>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Production</h4>
            <p class="text-sm text-gray-500 mb-4">Self-Hosted<br/>Single server</p>
            <code class="text-xs bg-gray-100 px-3 py-1.5 rounded-full">docker compose up</code>
          </div>
          <div class="border border-gray-200 rounded-xl p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-accent font-bold">3</span>
            </div>
            <h4 class="font-semibold text-gray-900 mb-2">Scale</h4>
            <p class="text-sm text-gray-500 mb-4">Multi-Region<br/>Load balanced</p>
            <code class="text-xs bg-gray-100 px-3 py-1.5 rounded-full">Kubernetes / Terraform</code>
          </div>
        </div>

        <!-- When to Self-Host -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">When to Self-Host</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Scenario</th>
                <th class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50">Recommendation</th>
              </tr>
            </thead>
            <tbody class="text-gray-900">
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4">Prototyping, MVPs</td>
                <td class="py-3 px-4"><span class="text-accent font-medium">Use public infrastructure</span></td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4">&lt; 10,000 daily users</td>
                <td class="py-3 px-4"><span class="text-accent font-medium">Use public infrastructure</span></td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4">&gt; 10,000 daily users</td>
                <td class="py-3 px-4"><span class="text-purple-600 font-medium">Consider self-hosting</span></td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4">Privacy requirements</td>
                <td class="py-3 px-4"><span class="text-orange-600 font-medium">Self-host required</span></td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 px-4">Offline/air-gapped</td>
                <td class="py-3 px-4"><span class="text-orange-600 font-medium">Self-host required</span></td>
              </tr>
              <tr>
                <td class="py-3 px-4">Custom map data</td>
                <td class="py-3 px-4"><span class="text-orange-600 font-medium">Self-host required</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Data Flow -->
      <section id="data-flow" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Data Flow
        </h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Understand how data flows through the Navigatr SDK for different use cases.
        </p>

        <!-- Route Request Flow -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Route Request Flow</h3>
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8 overflow-x-auto">
          <pre class="font-mono text-xs text-gray-300 leading-relaxed"><code><span class="text-purple-400">User types destination</span>
        │
        ▼
┌─────────────────┐
│  <span class="text-cyan-400">@navigatr/web</span>  │
│                 │
│  1. Autocomplete│──────▶ <span class="text-yellow-300">Photon</span> (suggestions)
│                 │
│  2. Geocode     │──────▶ <span class="text-yellow-300">Nominatim</span> (coordinates)
│                 │
│  3. Route       │──────▶ <span class="text-yellow-300">Valhalla</span> (directions)
│                 │
│  4. Render      │──────▶ <span class="text-yellow-300">Tile Server</span> (map tiles)
│                 │
└─────────────────┘
        │
        ▼
   <span class="text-green-400">Map displayed</span>
   <span class="text-green-400">with route</span></code></pre>
        </div>

        <!-- Real-Time Tracking Flow -->
        <h3 class="text-xl font-semibold text-gray-900 mb-4">Real-Time Tracking Flow</h3>
        <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 overflow-x-auto">
          <pre class="font-mono text-xs text-gray-300 leading-relaxed"><code><span class="text-purple-400">Driver location update</span>
        │
        ▼
┌─────────────────┐
│  <span class="text-orange-400">Your Backend</span>   │  (WebSocket/Firebase/Supabase)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  <span class="text-cyan-400">@navigatr/web</span>  │
│                 │
│  1. Update pos  │──────▶ <span class="text-green-400">Move driver marker</span>
│                 │
│  2. Recalc ETA  │──────▶ <span class="text-yellow-300">Valhalla</span> (new route)
│                 │
│  3. Re-render   │──────▶ <span class="text-green-400">Update route line</span>
│                 │
└─────────────────┘</code></pre>
        </div>
      </section>
    </main>
  </div>
</template>
