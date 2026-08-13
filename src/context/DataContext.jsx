import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { MONTHLY_FINANCIALS, COMPANY_PROFILE } from '../data/datasets';

const DataContext = createContext(null);

/**
 * DataProvider — React context that manages financial time-series data
 * and the company profile. Supports CSV-driven data replacement via loadData.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function DataProvider({ children }) {
  const [data, setData] = useState(MONTHLY_FINANCIALS);
  const [profile, setProfile] = useState(COMPANY_PROFILE);

  /**
   * Replace the dataset with validated CSV-parsed data.
   * @param {Array<object>} newData — array of objects with at least 'month' and 'revenue' keys
   * @returns {boolean} true if data was accepted
   */
  const loadData = useCallback((newData) => {
    if (!Array.isArray(newData) || newData.length === 0) return false;
    if (!newData[0].month || !newData[0].revenue) return false;
    setData(newData);
    return true;
  }, []);

  const value = useMemo(() => ({
    data,
    setData: loadData,
    profile,
    setProfile,
    hasData: data.length > 0,
    dataCount: data.length,
  }), [data, profile, loadData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/**
 * Hook to consume the DataContext. Must be used inside DataProvider.
 * @returns {{ data: Array, setData: Function, profile: object, setProfile: Function, hasData: boolean, dataCount: number }}
 */
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
