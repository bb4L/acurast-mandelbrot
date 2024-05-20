class Mutex {
  private _queue: any[]
  private _locked: boolean
  constructor() {
    this._queue = []
    this._locked = false
  }

  lock() {
    return new Promise<void>((resolve) => {
      if (this._locked) {
        this._queue.push(resolve)
      } else {
        this._locked = true
        resolve()
      }
    })
  }

  unlock() {
    if (this._queue !== undefined && this._queue.length > 0) {
      const resolve = this._queue.shift()
      if (resolve === undefined) {
        return
      }
      resolve()
    } else {
      this._locked = false
    }
  }

  async runExclusive(callback: any) {
    await this.lock()
    try {
      return await callback()
    } finally {
      this.unlock()
    }
  }
}

export class AsyncSafeSet<t> {
  private _set: Set<unknown>
  private _mutex: Mutex
  constructor() {
    this._set = new Set()
    this._mutex = new Mutex()
  }

  async add(item: t) {
    await this._mutex.runExclusive(() => {
      this._set.add(item)
    })
  }

  async delete(item: t) {
    await this._mutex.runExclusive(() => {
      this._set.delete(item)
    })
  }

  async has(item: t) {
    return await this._mutex.runExclusive(() => {
      return this._set.has(item)
    })
  }

  async size() {
    return await this._mutex.runExclusive(() => {
      return this._set.size
    })
  }

  async values() {
    return await this._mutex.runExclusive(() => {
      return Array.from(this._set.values())
    })
  }

  async clear() {
    return await this._mutex.runExclusive(() => {
      this._set.clear()
    })
  }
}
