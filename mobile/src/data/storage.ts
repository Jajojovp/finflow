import Storage from "expo-sqlite/kv-store";
export const storage = {
  read: (key = "finflow-mobile-v1") => Storage.getItemAsync(key),
  write: (value: string, key = "finflow-mobile-v1") => Storage.setItemAsync(key, value),
};
