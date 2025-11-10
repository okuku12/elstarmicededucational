import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Heart } from "lucide-react";
const About = () => {
  return <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-foreground">About Excellence Academy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Since 2000, we've been dedicated to providing exceptional education that prepares students for success in an ever-changing world.
          </p>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4 w-fit">
                <Target className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To provide a nurturing and challenging educational environment that develops well-rounded individuals prepared to excel academically, socially, and personally.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4 w-fit">
                <Eye className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To be a leading institution that inspires lifelong learners and responsible global citizens who contribute positively to society.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4 w-fit">
                <Heart className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground space-y-2">
                <li>• Excellence in all endeavors</li>
                <li>• Integrity and honesty</li>
                <li>• Respect and inclusivity</li>
                <li>• Innovation and creativity</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Principal's Message */}
        <div className="bg-muted/30 rounded-lg p-8 md:p-12 mb-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Message from the Principal</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Dear Students, Parents, and Community Members,
            </p>
            <p>It is with great pride and enthusiasm that I welcome you to Excellence Academy. Our school has been a cornerstone of educational excellence in our community for over two decades, and we continue to evolve and adapt to meet the needs of our students in the 21st centu</p>
            <p>We understand that education is not just about passing examinations, but about preparing young people for life. That's why we emphasize values such as integrity, respect, and responsibility alongside academic achievement.</p>
            <p>I invite you to join our community and experience the Elstar Mix Secondary School difference. Together, we can help your child reach their full potential</p>
            <p className="font-semibold text-foreground">I invite you to join our community and experience the Elstar Mix Secondary School difference. Together, we can help your child reach their full potential.

Mr. Joel Onyango

Director, Elstar Mixed Education Centre<br />
              Principal, Excellence Academy
            </p>
          </div>
        </div>

        {/* School History */}
        <div>
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Our History</h2>
          <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground">
            <p>Elstar Mixed Education Centre was founded in 2018 with a vision to provide quality education that nurtures not just academic excellence, but also strong character, leadership skills, and a sense of social responsibility.</p>
            <p>
              Over the years, we have expanded our facilities to include modern science laboratories, computer labs, a well-stocked library, sports facilities, and art studios. Our curriculum has evolved to incorporate the latest educational research and technology while maintaining a strong foundation in core academic subjects.
            </p>
            <p>
              Today, Excellence Academy stands as a testament to our commitment to educational excellence. Our graduates have gone on to attend prestigious universities and pursue successful careers in various fields, making us proud of their achievements and contributions to society.
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default About;