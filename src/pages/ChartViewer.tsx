import { TradingViewWidget } from "@/components/TradingViewWidget";
import { SlideInMenu } from "@/components/SlideInMenu";

const ChartViewer = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <SlideInMenu />
      <TradingViewWidget />
    </div>
  );
};

export default ChartViewer;
