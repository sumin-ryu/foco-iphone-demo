import { useMemo } from 'react';
import { buildRecords } from '../data/records.js';
import { useAppStore } from '../store/AppStore.jsx';

/** Calendar records: the demo history plus sessions finished in this app. */
export function useRecords() {
  const { results } = useAppStore();
  return useMemo(() => buildRecords(results), [results]);
}
