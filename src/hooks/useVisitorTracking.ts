import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

interface DeviceInfo {
  type: string;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
}

const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Detect device type
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    type = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    type = 'mobile';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return {
    type,
    browser,
    os,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height
  };
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

const fetchGeoData = async (): Promise<GeoData> => {
  try {
    // Use ip-api.com (free, no API key required)
    const response = await fetch('https://ip-api.com/json/?fields=country,city,regionName,lat,lon,timezone,isp');
    if (!response.ok) {
      throw new Error('Failed to fetch geo data');
    }
    const data = await response.json();
    return {
      country: data.country,
      city: data.city,
      region: data.regionName,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp
    };
  } catch (error) {
    console.log('Geo lookup failed, using fallback');
    // Fallback - try ipapi.co
    try {
      const fallbackResponse = await fetch('https://ipapi.co/json/');
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        return {
          country: data.country_name,
          city: data.city,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone,
          isp: data.org
        };
      }
    } catch {
      // Silent fail
    }
    return {};
  }
};

export const useVisitorTracking = (pageName: string) => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const sessionId = getSessionId();
        const deviceInfo = getDeviceInfo();
        const geoData = await fetchGeoData();
        
        const metadata: Json = {
          device: {
            type: deviceInfo.type,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            screenWidth: deviceInfo.screenWidth,
            screenHeight: deviceInfo.screenHeight
          },
          geo: {
            country: geoData.country || null,
            city: geoData.city || null,
            region: geoData.region || null,
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
            timezone: geoData.timezone || null,
            isp: geoData.isp || null
          },
          referrer: document.referrer || 'direct',
          language: navigator.language,
          timestamp: new Date().toISOString()
        };
        
         const { data: { session } } = await supabase.auth.getSession();

        await supabase.from('user_interactions').insert([{
          interaction_type: 'page_view',
          page_visited: pageName,
          session_id: sessionId,
          user_id: session?.user?.id ?? null,
          user_agent: navigator.userAgent,
          metadata
        }]);
        
        console.log(`Tracked visit to ${pageName}`);
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };
    
    trackVisit();
  }, [pageName]);
};

export const trackInteraction = async (
  interactionType: string,
  pageName: string,
  additionalData?: Record<string, unknown>
) => {
  try {
    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    
    const metadata: Json = {
      device: {
        type: deviceInfo.type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight
      },
      ...additionalData,
      timestamp: new Date().toISOString()
    };
    
   const { data: { session } } = await supabase.auth.getSession();
 await supabase.from('user_interactions').insert([{
  interaction_type: interactionType,
  page_visited: pageName,
  session_id: sessionId,
  user_id: session?.user?.id ?? null,
  user_agent: navigator.userAgent,
  metadata
}]);

  } catch (error) {
    console.error('Error tracking interaction:', error);
  }
};
