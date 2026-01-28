import Database from 'better-sqlite3';

const sqlite = new Database('./bausmail.db');
console.log('Checkpointing WAL file...');
sqlite.pragma('wal_checkpoint(FULL)');
console.log('Done! All data committed to main database file.');
sqlite.close();
