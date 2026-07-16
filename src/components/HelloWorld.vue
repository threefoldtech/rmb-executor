<script setup lang="ts">
import { onMounted, ref } from "vue";
import { requestRmb } from "../client/client";
import { useRmb } from "../stores/client";
import DialogComponent from "./dialoge.vue";

const rmbStore = useRmb();
const response = ref("");
const dialogVisible = ref(false);

onMounted(async () => {
  try {
    await rmbStore.set();
  } catch (err) {
    console.error(`RMB Client connection failed due to ${err}`);
  }
});

const formData = ref({
  command: "",
  payload: "",
  twinId: 17,
});

const handleSubmit = async () => {
  if (!rmbStore.rmbClient) {
    response.value = "RMB client is not connected.";
    dialogVisible.value = true;
    return;
  }

  try {
    const result = await requestRmb(
      rmbStore.rmbClient,
      formData.value.command,
      formData.value.payload,
      Number(formData.value.twinId)
    );
    response.value =
      typeof result === "string" ? result : JSON.stringify(result);
  } catch (err) {
    response.value = `Request failed: ${err}`;
  }

  // Open the dialog after submission
  dialogVisible.value = true;
};
</script>

<template>
  <DialogComponent v-model:dialogVisible="dialogVisible" :response="response" />

  <v-container class="d-flex flex-column justify-center align-center">
    <v-responsive class="mx-auto">
      <!-- <div class="text-center">
        <h1 class="text-h2 font-weight-bold" color="primary">
          Rmb Client Task
        </h1>
      </div> -->

      <v-row>
        <v-col cols="12">
          <v-card
            class="py-4"
            color="surface-variant"
            rounded="lg"
            variant="outlined"
          >
            <v-text-field
              class="pa-4"
              v-model="formData.twinId"
              hide-details="auto"
              label="Twin Id"
              type="number"
              clearable
            ></v-text-field>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="py-4"
            color="surface-variant"
            rounded="lg"
            variant="outlined"
          >
            <v-text-field
              class="pa-4"
              v-model="formData.command"
              hide-details="auto"
              label="Rmb command"
              clearable
            ></v-text-field>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card
            class="py-4"
            color="surface-variant"
            rounded="lg"
            variant="outlined"
          >
            <v-textarea
              class="pa-4"
              v-model="formData.payload"
              hide-details="auto"
              label="Payload"
              clearable
            ></v-textarea>
          </v-card>
        </v-col>

        <v-col cols="12" class="text-center">
          <v-btn color="primary" class="mt-4" @click="handleSubmit">
            Submit
          </v-btn>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>
