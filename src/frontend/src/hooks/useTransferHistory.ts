import { useState, useEffect } from 'react';

export interface TransferHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  type: 'sent' | 'received';
  peerName: string;
  status: 'completed' | 'failed';
  timestamp: number;
}

const STORAGE_KEY = 'p2p-transfer-history';
const MAX_HISTORY_ITEMS = 50;

export function useTransferHistory() {
  const [history, setHistory] = useState<TransferHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load transfer history:', error);
      }
    }
  }, []);

  const addTransfer = (
    transfer: Omit<TransferHistoryItem, 'id' | 'timestamp'>
  ) => {
    const newItem: TransferHistoryItem = {
      ...transfer,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    history,
    addTransfer,
    clearHistory,
  };
}
