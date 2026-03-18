<script setup lang="ts">
const email = ref("");

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
    <div class="flex gap-20 items-start max-lg:flex-col max-lg:gap-12">
      <!-- Left Column -->
      <div class="flex-1 max-w-lg max-lg:max-w-none">
        <p class="text-lg text-gray-900 mb-12">
          Maps for your app. No API bills. No lock-in. Ever.
        </p>

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
          <code class="block text-sm text-gray-900 mb-4">
            npm install @<span class="text-accent">navigatr</span>/sdk
          </code>
          <div class="flex gap-3 max-md:flex-col">
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
          </div>
        </section>

        <!-- Newsletter -->
        <section class="mb-10">
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
        </section>
      </div>

      <!-- Right Column - Mockup -->
      <div class="flex-1 flex justify-center items-start pt-5 max-lg:w-full">
        <RideShareDemo />
      </div>
    </div>
  </div>
</template>
