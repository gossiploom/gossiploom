import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Links and Contact Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Legal & Support Links - Horizontal */}
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About Us
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/refund" className="text-muted-foreground hover:text-primary transition-colors">
              Refund Policy
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/platform-guide" className="text-muted-foreground hover:text-primary transition-colors">
              Platform Guide
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
              Contact Us
            </Link>
            <span className="text-border hidden sm:inline">|</span>
            <Link to="/freesignals" className="text-muted-foreground hover:text-primary transition-colors">
              FreeSignals
            </Link>
          </nav>

          {/* Contact Email */}
          <div className="text-sm">
            <span className="text-muted-foreground">Queries: </span>
            <a 
              href="mailto:support@tradeadvisor.live" 
              className="text-primary hover:underline"
            >
              support@tradeadvisor.live
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Trade Advisor. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Trading involves risk. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
};
