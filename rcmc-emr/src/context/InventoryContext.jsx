import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/supabase'

const InventoryContext = createContext()

export const useInventory = () => {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider')
  }
  return context
}

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([])
  const [summaries, setSummaries] = useState([])
  const [expiringBatches, setExpiringBatches] = useState([])
  const [expiredBatches, setExpiredBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const [data, summaryData, expiringData, expiredData] = await Promise.all([
        db.getInventory(),
        db.getInventorySummary(),
        db.getExpiringInventory(),
        db.getExpiredInventory()
      ])
      setInventory(data)
      setSummaries(summaryData)
      setExpiringBatches(expiringData)
      setExpiredBatches(expiredData)
    } catch (error) {
      console.error('Error loading inventory from database:', error)
      setInventory([])
      setSummaries([])
      setExpiringBatches([])
      setExpiredBatches([])
    } finally {
      setLoading(false)
    }
  }

  const deductStock = async (medicineId, quantity) => {
    try {
      const updated = await db.deductStock(medicineId, quantity)
      setInventory(prevInventory =>
        prevInventory.map(item => item.id === medicineId ? updated : item)
      )
    } catch (error) {
      console.error('Error deducting stock:', error)
      throw error
    }
  }

  const addStock = async (medicineId, quantity) => {
    try {
      const updated = await db.addStock(medicineId, quantity)
      setInventory(prevInventory =>
        prevInventory.map(item => item.id === medicineId ? updated : item)
      )
    } catch (error) {
      console.error('Error adding stock:', error)
      throw error
    }
  }

  const value = {
    inventory,
    setInventory,
    summaries,
    expiringBatches,
    expiredBatches,
    deductStock,
    addStock,
    loading,
    loadInventory
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}
