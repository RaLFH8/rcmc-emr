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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      // Load from Supabase database
      const data = await db.getInventory()
      setInventory(data)
    } catch (error) {
      console.error('Error loading inventory from database:', error)
      // Fallback to empty array if database fails
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  // Function to deduct stock when medicine is added to bill
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

  // Function to add stock (for restocking)
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
