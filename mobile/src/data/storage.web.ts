export const storage = {
  async read() {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem("finflow-mobile-v1");
  },
  async write(value: string) {
    window.localStorage.setItem("finflow-mobile-v1", value);
  },
};
