export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="prose prose-gray max-w-none dark:prose-invert">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            📝 Legal pages are currently being finalized. These terms will be updated before launch.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            By accessing and using One-Link, you accept and agree to be bound by the terms and provision of this
            agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Platform Overview</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            One-Link is an influencer commerce platform connecting suppliers, influencers, and customers through
            personalized shopping experiences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Suppliers must provide accurate product information and maintain inventory</li>
            <li>Influencers must comply with FTC disclosure requirements</li>
            <li>Customers are responsible for their purchase decisions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Commission Structure</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Commission rates are set by suppliers and clearly displayed to influencers. Payments are processed according
            to our payment schedule.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
