import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
}

export interface TradingViewWidgetRef {
  takeSnapshot: () => void;
}

const TradingViewWidget = forwardRef<TradingViewWidgetRef, TradingViewWidgetProps>(({ 
  symbol = "OANDA:XAUUSD", 
  interval = "D" 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    takeSnapshot: () => {
      if (widgetRef.current && widgetRef.current.takeScreenshot) {
        widgetRef.current.takeScreenshot();
      }
    }
  }));

  useEffect(() => {
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        const widget = new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          hide_side_toolbar: false,
          studies: [
            "STD;SMA",
            "STD;RSI",
          ],
          disabled_features: [],
          enabled_features: ["study_templates", "snapshot_trading_drawings"],
        });
        widgetRef.current = widget;
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [symbol, interval]);

  return (
    <div 
      ref={containerRef}
      id="tradingview_widget"
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
    />
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
