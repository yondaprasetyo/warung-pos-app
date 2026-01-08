const isBrowser = typeof window !== 'undefined';

// Polyfill untuk window.storage
if (isBrowser && !window.storage) {
  window.storage = {
    async get(key) {
      try {
        const value = localStorage.getItem(key);
        return value ? { key, value } : null;
      } catch (error) {
        console.error('Storage get error:', error);
        return null;
      }
    },
    async set(key, value) {
      try {
        localStorage.setItem(key, value);
        return { key, value };
      } catch (error) {
        console.error('Storage set error:', error);
        return null;
      }
    },
    async delete(key) {
      try {
        localStorage.removeItem(key);
        return { key, deleted: true };
      } catch (error) {
        console.error('Storage delete error:', error);
        return null;
      }
    }
  };
}

export const storage = isBrowser ? window.storage : null;

export const saveDataToStorage = async (key, data) => {
  if (!storage) return;
  try {
    await storage.set(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};