import { useCallback, useEffect, useState } from 'react'
import {
  deleteScenario,
  duplicateScenario,
  initScenarioDb,
  listScenarios,
  renameScenario,
  saveScenario,
} from '../db/scenarioDb'

export function useScenarios() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [activeName, setActiveName] = useState(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      await initScenarioDb()
      setRecords(await listScenarios())
    } catch (err) {
      setError(err?.message || 'Failed to load scenarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = useCallback(async (name, assumptions, existingId = null) => {
    const saved = await saveScenario(name, assumptions, existingId ?? null)
    setActiveId(saved.id)
    setActiveName(saved.name)
    await refresh()
    return saved
  }, [activeId, refresh])

  const remove = useCallback(async (id) => {
    await deleteScenario(id)
    if (activeId === id) {
      setActiveId(null)
      setActiveName(null)
    }
    await refresh()
  }, [activeId, refresh])

  const rename = useCallback(async (id, name) => {
    const updated = await renameScenario(id, name)
    if (activeId === id) setActiveName(updated.name)
    await refresh()
    return updated
  }, [activeId, refresh])

  const duplicate = useCallback(async (id, newName) => {
    const copy = await duplicateScenario(id, newName)
    await refresh()
    return copy
  }, [refresh])

  const markActive = useCallback((record) => {
    if (!record) {
      setActiveId(null)
      setActiveName(null)
      return
    }
    setActiveId(record.id)
    setActiveName(record.name)
  }, [])

  const clearActive = useCallback(() => {
    setActiveId(null)
    setActiveName(null)
  }, [])

  return {
    records,
    loading,
    error,
    activeId,
    activeName,
    refresh,
    save,
    remove,
    rename,
    duplicate,
    markActive,
    clearActive,
  }
}
