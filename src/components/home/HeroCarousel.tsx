import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-school.jpg";

interface HeroSection {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string;
  button_link: string;
  background_image: string | null;
}

interface HeroImage {
  id: string;
  image_url: string;
  display_order: number;
}

const HeroCarousel = () => {
  const [heroData, setHeroData] = useState<HeroSection | null>(null);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    const [heroResult, imagesResult] = await Promise.all([
      supabase
        .from("hero_section")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("hero_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    if (heroResult.data) setHeroData(heroResult.data);
    if (imagesResult.data) setHeroImages(imagesResult.data);
  };

  // Get all images to cycle through
  const getAllImages = useCallback(() => {
    const images: string[] = [];
    
    // Add carousel images first
    heroImages.forEach((img) => {
      images.push(img.image_url);
    });
    
    // If no carousel images, use the main background or default
    if (images.length === 0) {
      images.push(heroData?.background_image || heroImage);
    }
    
    return images;
  }, [heroImages, heroData]);

  const images = getAllImages();

  // Auto-advance carousel
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsTransitioning(false);
    }, 300);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 300);
  };

  const heroTitle = heroData?.title || "Welcome to Elstar Mixed Educational Centre";
  const heroSubtitle = heroData?.subtitle || "Education Is Light";
  const heroButtonText = heroData?.button_text || "Apply Now";
  const heroButtonLink = heroData?.button_link || "/admissions";

  return (
    <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Images - No overlay for clear visibility */}
      {images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex && !isTransitioning ? "opacity-100" : "opacity-0"
          }`}
        >
          <img 
            src={image} 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Content - Positioned at bottom with subtle backdrop for readability */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to={heroButtonLink}>
                  {heroButtonText} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Positioned in middle of image area */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/3 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-white text-primary shadow-lg transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/3 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-white text-primary shadow-lg transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all shadow-md ${
                index === currentIndex
                  ? "bg-white scale-110"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroCarousel;
