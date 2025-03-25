import { createApp } from "vue";
import App from "./App.vue";
import CKEditor from "@ckeditor/ckeditor5-vue";

const app = createApp(App);
app.use(CKEditor);
app.mount("#app");
