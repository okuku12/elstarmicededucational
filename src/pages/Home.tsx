import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-school.jpg";
const Home = () => {
  return <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${heroImage})`
      }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">Welcome to Elstar Mixed Educational Centre</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-primary-foreground/90">
            Empowering minds, building futures. Where education meets excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/admissions">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Why Choose Elstar Mixed Educational Centre?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
            icon: <GraduationCap className="h-10 w-10" />,
            title: "Quality Education",
            description: "Excellence in teaching with experienced faculty and modern curriculum"
          }, {
            icon: <BookOpen className="h-10 w-10" />,
            title: "Modern Facilities",
            description: "State-of-the-art classrooms, labs, and learning resources"
          }, {
            icon: <Users className="h-10 w-10" />,
            title: "Diverse Community",
            description: "A welcoming environment that celebrates diversity and inclusion"
          }, {
            icon: <Award className="h-10 w-10" />,
            title: "Proven Results",
            description: "Outstanding academic achievements and college acceptance rates"
          }].map((feature, index) => <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[{
            number: "1000+",
            label: "Students"
          }, {
            number: "50+",
            label: "Teachers"
          }, {
            number: "95%",
            label: "Success Rate"
          }, {
            number: "25+",
            label: "Years of Excellence"
          }].map((stat, index) => <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join Us?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-foreground/90">
            Start your journey toward academic excellence. Apply now and become part of our thriving community.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/admissions">
              Start Application <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>;
};
export default Home;