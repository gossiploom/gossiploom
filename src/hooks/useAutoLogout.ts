import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export const useAutoLogout = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    console.log('Auto-logout triggered due to inactivity');
    toast.info('You have been signed out due to inactivity');
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Start the initial timer
    resetTimer();

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  return null;
};
