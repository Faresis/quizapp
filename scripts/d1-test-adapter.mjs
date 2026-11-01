export function d1(db) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() { return db.prepare(sql).get(...args) || null; },
            async all() { return {results:db.prepare(sql).all(...args)}; },
            async run() { const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}; }
          };
        }
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try { const results=[];for(const statement of statements) results.push(await statement.run());db.exec('COMMIT');return results; }
      catch(error) { db.exec('ROLLBACK');throw error; }
    }
  };
}
