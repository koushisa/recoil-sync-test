const createStorage = (initial: object) => {
  let storage = initial;

  return {
    get() {
      return storage;
    },
    set(obj: object) {
      storage = obj;
    }
  };
};

export const mockRemoteStorage = createStorage({
  name: "remote storage name",
  description: "remote storage description"
});
