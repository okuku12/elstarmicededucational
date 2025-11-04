import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Microscope, Palette, Calculator, Globe, Music } from "lucide-react";

const Academics = () => {
  const departments = [
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "English & Literature",
      description: "Comprehensive language arts program focusing on reading, writing, and critical thinking skills.",
      subjects: ["English Language", "Literature", "Creative Writing", "Public Speaking"],
    },
    {
      icon: <Calculator className="h-8 w-8" />,
      title: "Mathematics",
      description: "From basic arithmetic to advanced calculus, building strong mathematical foundations.",
      subjects: ["Algebra", "Geometry", "Calculus", "Statistics"],
    },
    {
      icon: <Microscope className="h-8 w-8" />,
      title: "Sciences",
      description: "Hands-on learning in modern laboratories with experienced science educators.",
      subjects: ["Biology", "Chemistry", "Physics", "Environmental Science"],
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Social Studies",
      description: "Understanding our world through history, geography, and social sciences.",
      subjects: ["History", "Geography", "Economics", "Civics"],
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Arts",
      description: "Fostering creativity and self-expression through various artistic mediums.",
      subjects: ["Visual Arts", "Drama", "Design", "Art History"],
    },
    {
      icon: <Music className="h-8 w-8" />,
      title: "Music & Performance",
      description: "Developing musical talent and appreciation through theory and practice.",
      subjects: ["Music Theory", "Choir", "Band", "Music Technology"],
    },
  ];

  const programs = [
    {
      title: "Primary School",
      grades: "Kindergarten - Grade 5",
      description: "Building strong foundations in literacy, numeracy, and social skills through engaging, age-appropriate activities.",
    },
    {
      title: "Middle School",
      grades: "Grade 6 - Grade 8",
      description: "Transitioning to more specialized subjects while maintaining a balanced curriculum and supporting adolescent development.",
    },
    {
      title: "High School",
      grades: "Grade 9 - Grade 12",
      description: "College preparatory curriculum with advanced placement options and career guidance to prepare for future success.",
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-foreground">Academic Programs</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Excellence Academy offers a comprehensive curriculum designed to challenge and inspire students at every level.
          </p>
        </div>

        {/* Programs Overview */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Our Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((program, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">{program.title}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">{program.grades}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Academic Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4 w-fit">
                    {dept.icon}
                  </div>
                  <CardTitle className="text-xl">{dept.title}</CardTitle>
                  <CardDescription>{dept.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-2 text-foreground">Key Subjects:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {dept.subjects.map((subject, idx) => (
                      <li key={idx}>• {subject}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Academic Excellence */}
        <div className="mt-20 bg-primary text-primary-foreground rounded-lg p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Academic Excellence</h2>
            <p className="text-lg mb-6 text-primary-foreground/90">
              Our rigorous curriculum is complemented by dedicated teachers, modern facilities, and a supportive learning environment that encourages students to reach their full potential.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-sm text-primary-foreground/80">Graduation Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">90%</div>
                <div className="text-sm text-primary-foreground/80">College Acceptance</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">15:1</div>
                <div className="text-sm text-primary-foreground/80">Student-Teacher Ratio</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Academics;
