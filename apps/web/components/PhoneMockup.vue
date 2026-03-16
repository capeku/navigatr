<script setup lang="ts">
</script>

<template>
  <div class="phone-frame">
    <div class="phone-bezel">
      <div class="dynamic-island"></div>
      <div class="phone-screen">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-frame {
  width: 320px;
  height: 680px;
  background: #1a1a1a;
  border-radius: 50px;
  padding: 12px;
  box-shadow:
    0 0 0 2px #333,
    0 25px 80px rgba(0, 0, 0, 0.5),
    0 10px 30px rgba(0, 0, 0, 0.3);
}

.phone-bezel {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
}

.dynamic-island {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 28px;
  background: #000;
  border-radius: 20px;
  z-index: 100;
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #111;
  position: relative;
  overflow: hidden;
}
</style>
