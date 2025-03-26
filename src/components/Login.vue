<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isLogin ? $t("auth.login") : $t("auth.register") }}</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <form @submit.prevent="submitForm">
        <div class="form-group" v-if="!isLogin">
          <label for="displayName">{{ $t("auth.name") }}</label>
          <input
            type="text"
            id="displayName"
            v-model="displayName"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">{{ $t("auth.email") }}</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">{{ $t("auth.password") }}</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ isLogin ? $t("auth.login") : $t("auth.register") }}
        </button>

        <div class="form-footer">
          <span v-if="isLogin">
            {{ $t("auth.noAccount") }}
            <a href="#" @click.prevent="toggleForm">{{
              $t("auth.registerHere")
            }}</a>
          </span>
          <span v-else>
            {{ $t("auth.haveAccount") }}
            <a href="#" @click.prevent="toggleForm">{{
              $t("auth.loginHere")
            }}</a>
          </span>
        </div>
      </form>

      <LoadingSpinner v-if="loading" :message="$t('auth.processing')" />
    </div>
  </div>
</template>

<script>
import AuthService from "../services/AuthService";
import LoadingSpinner from "./LoadingSpinner.vue";

export default {
  name: "Login",
  components: {
    LoadingSpinner,
  },
  data() {
    return {
      isLogin: true,
      email: "",
      password: "",
      displayName: "",
      error: null,
      loading: false,
    };
  },
  methods: {
    toggleForm() {
      this.isLogin = !this.isLogin;
      this.error = null;
    },

    async submitForm() {
      this.error = null;
      this.loading = true;

      try {
        if (this.isLogin) {
          await AuthService.login(this.email, this.password);
        } else {
          await AuthService.register(
            this.email,
            this.password,
            this.displayName
          );
        }

        // Authentication successful, parent component will handle navigation
        this.$emit("auth-success");
      } catch (error) {
        let errorMessage = this.$t("auth.errors.failed");

        // Extract more specific error messages from Firebase
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          errorMessage = this.$t("auth.errors.invalidCredentials");
        } else if (error.code === "auth/email-already-in-use") {
          errorMessage = this.$t("auth.errors.emailInUse");
        } else if (error.code === "auth/weak-password") {
          errorMessage = this.$t("auth.errors.weakPassword");
        } else if (error.code === "auth/invalid-email") {
          errorMessage = this.$t("auth.errors.invalidEmail");
        }

        this.error = errorMessage;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
body {
  padding: 0;
}
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f5f7;
}

.auth-card {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;

  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
  }
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 5px;
    color: #555;
  }

  input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #3498db;
    }

    &:disabled {
      background-color: #f9f9f9;
    }
  }
}

button {
  width: 100%;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
}

.form-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #555;

  a {
    color: #3498db;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.error-message {
  background-color: #fae5e5;
  color: #e74c3c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 14px;
}
</style>
