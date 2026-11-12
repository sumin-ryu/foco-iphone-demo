import { useMemo } from 'react';
import { lastUnfinished, latestReview } from '../data/review.js';
import { useAppStore } from '../store/AppStore.jsx';

/**
 * The last review to go over, the one a new focus should open with (null if turned off), and
 * the detail goals the last visit left unfinished.
 */
export function useLastReview() {
  const { lastResult, reviewFirst } = useAppStore();
  const review = useMemo(() => latestReview(lastResult), [lastResult]);
  const unfinished = useMemo(() => lastUnfinished(lastResult), [lastResult]);
  return { review, startWith: reviewFirst ? review : null, unfinished };
}
