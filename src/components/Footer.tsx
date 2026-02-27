import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube,
  Gift,
  Target,
  BarChart3,
  Users,
  HelpCircle,
  FileText,
  Shield
} from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">GossipLoom</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Professional forex trading signals and analysis to help you make informed trading decisions.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Signals Column */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Signals
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/free-signals" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Gift className="w-4 h-4 text-green-500" />
                  Free Signals
                </Link>
              </li>
              <li>
                <Link 
                  to="/signals" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  Premium Signals
                </Link>
              </li>
              <li>
                <Link 
                  to="/chart-viewer" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Chart Analysis
                </Link>
              </li>
              <li>
                <Link 
                  to="/news" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Market News
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/referral-program" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Referral Program
                </Link>
              </li>
              <li>
                <Link 
                  to="/purchase" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/faq" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/platform-guide" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Platform Guide
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Shield className="w-3 h-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                support@gossiploom.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                New York, NY
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              © {currentYear} GossipLoom. All rights reserved.
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto">
            <strong>Risk Disclaimer:</strong> Trading forex involves substantial risk of loss and is not suitable for all investors. 
            Past performance is not indicative of future results. Please ensure you fully understand the risks involved.
          </p>
        </div>
      </div>
    </footer>
  );
};
