<script setup lang="ts">
const width = defineModel('width')
const height = defineModel('height')
const iterations = defineModel('iterations')
const processors = defineModel('processors')
const calculating = defineModel('calculating')
const emit = defineEmits(['redraw'])
</script>

<template>
  <div v-if="calculating == false">
    <h1>Form</h1>
    <input type="number" v-model="width" />
    <input type="number" v-model="height" />
    <input type="number" v-model="iterations" />
    <input type="string" v-model="processors" />

    <button @click="$emit('redraw')">Calculate</button>
  </div>
</template>
