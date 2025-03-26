<template>
  <div class="language-selector">
    <div class="flag-container">
      <button
        @click="changeLanguage('en')"
        :class="['flag-btn', { active: currentLanguage === 'en' }]"
        title="English"
      >
        <span class="flag-icon">🇺🇸</span>
      </button>
      <button
        @click="changeLanguage('vi')"
        :class="['flag-btn', { active: currentLanguage === 'vi' }]"
        title="Tiếng Việt"
      >
        <span class="flag-icon">🇻🇳</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "LanguageSelector",
  data() {
    return {
      currentLanguage: this.$i18n.locale,
    };
  },
  methods: {
    changeLanguage(lang) {
      if (this.currentLanguage !== lang) {
        this.currentLanguage = lang;
        this.$i18n.locale = lang;
        localStorage.setItem("kanban-language", lang);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.language-selector {
  display: flex;
  align-items: center;

  .flag-container {
    display: flex;
    gap: 5px;
  }

  .flag-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s ease;
    opacity: 0.6;

    &:hover {
      transform: scale(1.1);
      opacity: 0.8;
    }

    &.active {
      opacity: 1;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
    }
  }

  .flag-icon {
    font-size: 1.4rem;
    display: block;
  }
}
</style>
