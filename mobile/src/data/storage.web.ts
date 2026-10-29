export const storage = {
  async read(key = "finflow-mobile-v1") {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(key);
  },
  async write(value: string, key = "finflow-mobile-v1") {
    window.localStorage.setItem(key, value);
  },
};
