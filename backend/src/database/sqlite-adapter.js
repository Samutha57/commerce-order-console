import { DatabaseSync } from 'node:sqlite';

export default class Database {
  constructor(filename, options = {}) {
    this.rawDb = new DatabaseSync(filename);
    this.rawDb.exec('PRAGMA foreign_keys = ON;');
  }

  exec(sql) {
    return this.rawDb.exec(sql);
  }

  pragma(pragmaStr) {
    return this.rawDb.exec(`PRAGMA ${pragmaStr}`);
  }

  prepare(sql) {
    const rawStmt = this.rawDb.prepare(sql);
    return {
      all: (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return rawStmt.all(...flat);
      },
      get: (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return rawStmt.get(...flat);
      },
      run: (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return rawStmt.run(...flat);
      }
    };
  }

  transaction(fn) {
    return (...args) => {
      this.rawDb.exec('BEGIN IMMEDIATE');
      try {
        const result = fn(...args);
        this.rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        this.rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  }

  close() {
    return this.rawDb.close();
  }
}
