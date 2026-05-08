import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Mountain, Home, Search, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <Mountain className="h-8 w-8 text-primary" />
          <span className="font-display text-2xl font-bold">
            Kashmir<span className="text-kashmir-gold">Alle</span>
          </span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* 404 Visual */}
          <div className="relative mb-8">
            <div className="text-[150px] md:text-[200px] font-display font-bold text-primary/10 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl md:text-8xl animate-bounce">🏔️</div>
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Oops! Lost in the Mountains
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            The page you're looking for seems to have wandered off into the beautiful Kashmir valleys. 
            Let's help you find your way back!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/">
              <Button variant="gold" size="lg" className="w-full sm:w-auto">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link to="/packages">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Explore Packages
              </Button>
            </Link>
          </div>

          {/* Quick Links */}
          <div className="border-t pt-8">
            <p className="text-sm text-muted-foreground mb-4">Popular destinations:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonmarg'].map((dest) => (
                <Link
                  key={dest}
                  to={`/packages?destination=${dest}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {dest}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-sm text-muted-foreground">
        <button 
          onClick={() => window.history.back()} 
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
};

export default NotFound;
