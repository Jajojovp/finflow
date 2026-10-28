import Storage from "expo-sqlite/kv-store";
export const storage = {
  read: () => Storage.getItemAsync("finflow-mobile-v1"),
  write: (value: string) => Storage.setItemAsync("finflow-mobile-v1", value),
};
