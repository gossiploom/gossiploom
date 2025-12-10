import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView: any;
  }
}

export const TradingViewWidget = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        widgetRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: "OANDA:USDCAD",
          interval: "4H",
          timezone: "Etc/UTC",
          theme: "white",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: true,
          withdateranges: true,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          calendar: true,
          client_id: "tradingview.com",
          user_id: "public_user",
          container_id: "tradingview_chart",

          enabled_features: ["save_chart_properties_to_local_storage"],
          disabled_features: [],

          drawings_access: {
            type: "white",
            tools: [
              { name: "Regression Trend" },
              { name: "Trend Line" },
              { name: "Horizontal Line" },
              { name: "Vertical Line" },
              { name: "Arrow" },
              { name: "Rectangle" },
              { name: "Ellipse" },
              { name: "Triangle" },
              { name: "Polyline" },
              { name: "Fibonacci Retracement" },
              { name: "Pitchfork" },
              { name: "Gann Fan" },
              { name: "Head And Shoulders" },
              { name: "ABCD Pattern" },
              { name: "Long Position" },
              { name: "Short Position" },
              { name: "Brush" },
              { name: "Highlighter" },
              { name: "Anchored VWAP" }
            ],
          },

          watchlist: [
            "OANDA:XAUUSD",
            "OANDA:XAGUSD",
            "OANDA:EURUSD",
            "OANDA:GBPUSD",
            "OANDA:EURGBP",
            "OANDA:USDJPY",
            "OANDA:USDCAD",
            "OANDA:AUDUSD",
            "OANDA:AUDCAD",
            "OANDA:NAS100USD"
          ],
        });
      }
    };

    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div id="tradingview_chart" ref={containerRef} className="w-full h-full" />
    </div>
  );
};
