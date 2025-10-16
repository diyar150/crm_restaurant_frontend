import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../components/service/axiosInstance';

export function useItemUnits(itemId) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnits = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/item-unit/get/${id}`);
      setUnits(res.data || []);
      return res.data || [];
    } catch {
      setUnits([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId) {
      fetchUnits(itemId);
    } else {
      setUnits([]);
    }
  }, [itemId, fetchUnits]);

  return { units, loading, fetchUnits };
}