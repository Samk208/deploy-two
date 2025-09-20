export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="prose prose-gray max-w-none dark:prose-invert">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 mb-8">
          <p className="text-indigo-800 dark:text-indigo-200 font-medium">
            🔒 Your privacy is important to us. This policy explains how we collect, use, and protect your data.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Account information (email, name, role)</li>
            <li>Product and shop data for suppliers and influencers</li>
            <li>Purchase history and preferences</li>
            <li>Usage analytics and performance metrics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Provide and improve our platform services</li>
            <li>Process transactions and calculate commissions</li>
            <li>Send important updates and notifications</li>
            <li>Analyze usage patterns to enhance user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We implement industry-standard security measures to protect your personal information. Data is encrypted in
            transit and at rest.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
            <li>Access and download your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
