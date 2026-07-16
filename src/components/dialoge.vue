<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>Dialog</v-card-title>
      <v-card-text> {{ response }} </v-card-text>
      <v-card-actions>
        <v-btn color="primary" @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  name: "DialogComponent",
  props: {
    dialogVisible: {
      type: Boolean,
      default: false,
    },
    response: {
      type: String,
      default: "",
    },
  },
  setup(props, { emit }) {
    const dialog = ref(props.dialogVisible);

    watch(
      () => props.dialogVisible,
      (newVal) => {
        dialog.value = newVal;
      }
    );

    const closeDialog = () => {
      dialog.value = false;
      emit("update:dialogVisible", false);
    };

    return {
      dialog,
      closeDialog,
    };
  },
});
</script>
