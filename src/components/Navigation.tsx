import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap } from "lucide-react";
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navItems = [{
    path: "/",
    label: "Home"
  }, {
    path: "/about",
    label: "About"
  }, {
    path: "/academics",
    label: "Academics"
  }, {
    path: "/admissions",
    label: "Admissions"
  }, {
    path: "/contact",
    label: "Contact"
  }];
  const isActive = (path: string) => location.pathname === path;
  return <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">Elstar mixed Educational Centre</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </Link>)}
            <Button variant="default" size="sm">
              Apply Now
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navItems.map(item => <Link key={item.path} to={item.path} className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`} onClick={() => setIsOpen(false)}>
                {item.label}
              </Link>)}
            <Button variant="default" className="w-full">
              Apply Now
            </Button>
          </div>}
      </div>
    </nav>;
};
export default Navigation;