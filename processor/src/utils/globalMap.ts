class GlobalMap<v> {
  static instance: any;
  map!: Map<string, v>;
  locks!: Map<string, any>;
  constructor() {
    if (!GlobalMap.instance) {
      this.map = new Map();
      this.locks = new Map(); // To store locks for each key
      GlobalMap.instance = this;
    }
    return GlobalMap.instance;
  }

  async set(key: string, value: v) {
    await this.acquireLock(key);
    try {
      this.map.set(key, value);
    } finally {
      this.releaseLock(key);
    }
  }

  async get(key: string) {
    await this.acquireLock(key);
    try {
      return this.map.get(key);
    } finally {
      this.releaseLock(key);
    }
  }

  async delete(key: string) {
    await this.acquireLock(key);
    try {
      return this.map.delete(key);
    } finally {
      this.releaseLock(key);
    }
  }

  async acquireLock(key: string) {
    if (!this.locks.has(key)) {
      this.locks.set(key, []);
    }
    return new Promise<void>((resolve) => {
      const lockQueue = this.locks.get(key);
      lockQueue.push(resolve);
      if (lockQueue.length === 1) {
        resolve();
      }
    });
  }

  releaseLock(key: string) {
    const lockQueue = this.locks.get(key);
    if (lockQueue == undefined) {
      return;
    }
    lockQueue.shift();
    const nextLock = lockQueue[0];
    if (nextLock) {
      nextLock();
    } else {
      this.locks.delete(key);
    }
  }
}
