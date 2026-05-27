import initSqlJs from 'sql.js'

const IDB_NAME = 'energy-lab-db'
const IDB_STORE = 'sqlite'
const IDB_KEY = 'main'

let sqlModule = null
let db = null
let initPromise = null

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadDbBytes() {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

async function saveDbBytes(bytes) {
  const idb = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function persist() {
  if (!db) return
  const bytes = db.export()
  await saveDbBytes(bytes)
}

function ensureSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      assumptions TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    )
  `)
}

export async function initScenarioDb() {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    sqlModule = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
    const saved = await loadDbBytes()
    db = saved ? new sqlModule.Database(saved) : new sqlModule.Database()
    ensureSchema()
    await persist()
    return db
  })()

  return initPromise
}

function rowToScenario(columns, values) {
  const row = Object.fromEntries(columns.map((c, i) => [c, values[i]]))
  return {
    id: row.id,
    name: row.name,
    assumptions: JSON.parse(row.assumptions),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(rowToScenario(stmt.getColumnNames(), stmt.get()))
  }
  stmt.free()
  return rows
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows[0] ?? null
}

export async function listScenarios() {
  await initScenarioDb()
  return queryAll('SELECT * FROM scenarios ORDER BY updated_at DESC')
}

export async function getScenario(id) {
  await initScenarioDb()
  return queryOne('SELECT * FROM scenarios WHERE id = ?', [id])
}

export async function saveScenario(name, assumptions, existingId = null) {
  await initScenarioDb()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Scenario name is required')

  const now = new Date().toISOString()
  const json = JSON.stringify(assumptions)

  if (existingId) {
    db.run(
      'UPDATE scenarios SET name = ?, assumptions = ?, updated_at = ? WHERE id = ?',
      [trimmed, json, now, existingId],
    )
    await persist()
    return getScenario(existingId)
  }

  try {
    db.run(
      'INSERT INTO scenarios (name, assumptions, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [trimmed, json, now, now],
    )
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      throw new Error(`A scenario named "${trimmed}" already exists`)
    }
    throw err
  }

  await persist()
  return queryOne('SELECT * FROM scenarios WHERE id = last_insert_rowid()')
}

export async function renameScenario(id, name) {
  await initScenarioDb()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Scenario name is required')

  try {
    db.run('UPDATE scenarios SET name = ?, updated_at = ? WHERE id = ?', [
      trimmed,
      new Date().toISOString(),
      id,
    ])
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      throw new Error(`A scenario named "${trimmed}" already exists`)
    }
    throw err
  }

  await persist()
  return getScenario(id)
}

export async function deleteScenario(id) {
  await initScenarioDb()
  db.run('DELETE FROM scenarios WHERE id = ?', [id])
  await persist()
}

export async function duplicateScenario(id, newName) {
  const source = await getScenario(id)
  if (!source) throw new Error('Scenario not found')
  return saveScenario(newName, source.assumptions)
}

// ─── Chat sessions (SQLite) ───────────────────────────────────────────────────

function mapChatSession(columns, values) {
  const row = Object.fromEntries(columns.map((c, i) => [c, values[i]]))
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapChatMessage(columns, values) {
  const row = Object.fromEntries(columns.map((c, i) => [c, values[i]]))
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  }
}

function queryChatSessions(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(mapChatSession(stmt.getColumnNames(), stmt.get()))
  }
  stmt.free()
  return rows
}

function queryChatMessages(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(mapChatMessage(stmt.getColumnNames(), stmt.get()))
  }
  stmt.free()
  return rows
}

export async function listChatSessions() {
  await initScenarioDb()
  return queryChatSessions('SELECT * FROM chat_sessions ORDER BY updated_at DESC')
}

export async function createChatSession(title = 'New chat') {
  await initScenarioDb()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO chat_sessions (title, created_at, updated_at) VALUES (?, ?, ?)',
    [title, now, now],
  )
  await persist()
  return queryChatSessions('SELECT * FROM chat_sessions WHERE id = last_insert_rowid()')[0]
}

export async function renameChatSession(id, title) {
  await initScenarioDb()
  const trimmed = title.trim()
  if (!trimmed) throw new Error('Chat title is required')
  db.run('UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?', [
    trimmed,
    new Date().toISOString(),
    id,
  ])
  await persist()
  return queryChatSessions('SELECT * FROM chat_sessions WHERE id = ?', [id])[0]
}

export async function deleteChatSession(id) {
  await initScenarioDb()
  db.run('DELETE FROM chat_messages WHERE session_id = ?', [id])
  db.run('DELETE FROM chat_sessions WHERE id = ?', [id])
  await persist()
}

export async function listChatMessages(sessionId) {
  await initScenarioDb()
  return queryChatMessages(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY id ASC',
    [sessionId],
  )
}

export async function addChatMessage(sessionId, role, content) {
  await initScenarioDb()
  const now = new Date().toISOString()
  db.run(
    'INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)',
    [sessionId, role, content, now],
  )
  db.run('UPDATE chat_sessions SET updated_at = ? WHERE id = ?', [now, sessionId])
  await persist()
  return queryChatMessages('SELECT * FROM chat_messages WHERE id = last_insert_rowid()')[0]
}

export async function ensureDefaultChatSession() {
  const sessions = await listChatSessions()
  if (sessions.length > 0) return sessions[0]
  return createChatSession('Bankability review')
}
