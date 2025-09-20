import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Users, ShoppingBag, TrendingUp, Shield, Zap, Globe, Star, CheckCircle } from "lucide-react"

const features = [
  {
    icon: Users,
    title: "For Influencers",
    description: "Create your personalized shop, curate products, and earn commissions from every sale.",
    benefits: ["Custom shop pages", "Product curation tools", "Real-time analytics", "Flexible pricing"],
    cta: "Start Your Shop",
    href: "/influencers",
  },
  {
    icon: ShoppingBag,
    title: "For Suppliers",
    description: "Reach thousands of influencers and expand your market reach with our platform.",
    benefits: ["Global influencer network", "Inventory management", "Commission tracking", "Regional targeting"],
    cta: "List Your Products",
    href: "/brands",
  },
  {
    icon: TrendingUp,
    title: "For Customers",
    description: "Discover curated products from your favorite influencers and shop with confidence.",
    benefits: ["Curated selections", "Trusted recommendations", "Secure payments", "Fast shipping"],
    cta: "Start Shopping",
    href: "/shop",
  },
]

const stats = [
  { value: "10K+", label: "Active Influencers" },
  { value: "500+", label: "Brand Partners" },
  { value: "$2M+", label: "Creator Earnings" },
  { value: "50+", label: "Countries" },
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Fashion Influencer",
    content:
      "One-Link transformed how I monetize my content. Setting up my shop was effortless, and my earnings have tripled!",
    avatar: "/fashion-influencer-avatar.png",
  },
  {
    name: "Marcus Rodriguez",
    role: "Brand Manager at StyleCo",
    content:
      "The reach we've achieved through One-Link's influencer network is incredible. Our sales increased by 300% in just 3 months.",
    avatar: "/brand-manager-avatar.png",
  },
  {
    name: "Emma Thompson",
    role: "Customer",
    content:
      "I love discovering new products through my favorite creators. The shopping experience is seamless and trustworthy.",
    avatar: "/customer-avatar.png",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-amber-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              <Zap className="w-3 h-3 mr-1" />
              Powering the future of social commerce
            </Badge>

            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">
              Connect. Create.
              <span className="text-indigo-600"> Commerce.</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-pretty">
              The all-in-one platform where suppliers, influencers, and customers come together to create authentic
              shopping experiences that drive real results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-3" asChild>
                <Link href="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent" asChild>
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-2xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Everyone in the Commerce Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're creating, selling, or shopping, One-Link provides the tools you need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-2xl mb-6">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>

                    <p className="text-gray-600 mb-6">{feature.description}</p>

                    <ul className="space-y-2 mb-8">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" asChild>
                      <Link href={feature.href}>
                        {feature.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Creators and Brands Worldwide
            </h2>
            <p className="text-xl text-gray-600">Join thousands who are already growing their business with One-Link</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Commerce Experience?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join One-Link today and start building meaningful connections that drive real business results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 text-lg px-8 py-3" asChild>
                <Link href="/sign-up">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-indigo-600 text-lg px-8 py-3 bg-transparent"
                asChild
              >
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-indigo-200">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <span className="text-sm">Enterprise Security</span>
              </div>
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                <span className="text-sm">Global Reach</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                <span className="text-sm">Lightning Fast</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
