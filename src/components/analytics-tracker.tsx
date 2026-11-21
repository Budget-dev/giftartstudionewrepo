'use client';

import { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

export function AnalyticsTracker() {
  const db = useFirestore();

  useEffect(() => {
    if (!db || typeof window === 'undefined') return;

    // Check if session has already counted this visitor session
    const hasCountedSession = sessionStorage.getItem('gas_link_click_tracked');
    if (hasCountedSession) return;

    const trackLinkVisit = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refSource = urlParams.get('ref') || urlParams.get('utm_source') || 'direct_share';
        const isSharedLink = Boolean(urlParams.get('ref') || urlParams.get('utm_source') || document.referrer);

        const analyticsRef = doc(db, 'analytics', 'link_tracking');
        await setDoc(
          analyticsRef,
          {
            linkClicks: increment(1),
            sharedLinkClicks: isSharedLink ? increment(1) : increment(1),
            lastVisitedAt: serverTimestamp(),
            lastSource: refSource,
          },
          { merge: true }
        );

        sessionStorage.setItem('gas_link_click_tracked', 'true');
      } catch (err) {
        // Silent fail for non-blocking analytics
        console.debug('Analytics tracker note:', err);
      }
    };

    trackLinkVisit();
  }, [db]);

  return null;
}
