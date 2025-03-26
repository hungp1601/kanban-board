<template>
  <div class="spinner-container" :class="{ overlay: overlay }">
    <div class="spinner"></div>
    <div v-if="message" class="spinner-message">{{ message }}</div>
  </div>
</template>

<script>
export default {
  name: "LoadingSpinner",
  props: {
    message: {
      type: String,
      default: "",
    },
    overlay: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss" scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &.overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 9999;
  }
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

.spinner-message {
  margin-top: 15px;
  color: #333;
  font-size: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
