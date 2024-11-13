<script setup lang="ts">
const width = defineModel('width')
const height = defineModel('height')
const iterations = defineModel('iterations')
const processors = defineModel('processors')
const calculating = defineModel('calculating')
const emit = defineEmits(['redraw', 'redrawMin'])
</script>

<template>
  <div v-if="calculating == false">
    <h1>Form</h1>

    <label for="width">width: </label>
    <input id="width" type="number" v-model="width" /><br />
    <label for="height">height: </label>
    <input id="height" type="number" v-model="height" /><br />
    <label for="iterations">number of iterations: </label>
    <input id="iterations" type="number" v-model="iterations" /><br />
    <label for="processors">processors (separated by ,) </label>
    <input id="processors" type="string" v-model="processors" /><br />

    <button @click="$emit('redraw')">Draw</button>
  </div>
</template>
