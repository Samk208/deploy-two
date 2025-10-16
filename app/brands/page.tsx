import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Globe,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "Access thousands of influencers across multiple regions and markets.",
  },
  {
    icon: Users,
    title: "Influencer Network",
    description:
      "Connect with content creators who align with your brand values.",
  },
  {
    icon: TrendingUp,
    title: "Sales Growth",
    description:
      "Increase your revenue through authentic influencer partnerships.",
  },
  {
    icon: Building2,
    title: "Brand Control",
    description: "Maintain your brand identity while expanding your reach.",
  },
];

const benefits = [
  "No upfront marketing costs",
  "Pay only for results",
  "Regional market expansion",
  "Real-time performance tracking",
  "Automated commission payments",
  "Dedicated brand support",
];

const testimonials = [
  {
    name: "Marcus Rodriguez",
    role: "Brand Manager at StyleCo",
    content:
      "The reach we've achieved through One-Link's influencer network is incredible. Our sales increased by 300% in just 3 months.",
    avatar: "/brand-manager-avatar.png",
  },
  {
    name: "Jennifer Kim",
    role: "Marketing Director at TechFlow",
    content:
      "One-Link made it so easy to find the right influencers for our tech products. The ROI has been outstanding.",
    avatar: "/customer-avatar.png",
  },
];

export default function BrandsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
              <Zap className="w-3 h-3 mr-1" />
              For Brands & Suppliers
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">
              Expand Your
              <span className="text-blue-600"> Market</span>
              <br />
              Through Influence
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-pretty">
              Connect with thousands of influencers worldwide, expand your
              market reach, and grow your sales through authentic partnerships.
              No upfront costs, pay only for results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                asChild
              >
                <Link href="/sign-up">
                  List Your Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3 bg-transparent"
                asChild
              >
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful Tools for Brand Growth
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to scale your business through influencer
              partnerships and expand your market reach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Partner with One-Link?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join hundreds of successful brands that have transformed their
              marketing through influencer partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {benefits.slice(3).map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What Our Brand Partners Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover how brands are achieving remarkable growth through our
              influencer network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="text-gray-700 italic mb-4">
                    "{testimonial.content}"
                  </p>
                  <p className="text-gray-900 font-semibold">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Brand?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start expanding your market reach today through our global
            influencer network. It only takes a few minutes to get started.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            asChild
          >
            <Link href="/sign-up">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
