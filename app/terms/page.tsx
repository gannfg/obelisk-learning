export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using Obelisk Learning, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Use License</h2>
          <p className="text-muted-foreground mb-4">
            Permission is granted to temporarily access the materials on Obelisk Learning for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to reverse engineer any software contained on the platform</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
          <p className="text-muted-foreground mb-4">
            You are responsible for maintaining the confidentiality of your account and password. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>Provide accurate and complete information when creating an account</li>
            <li>Maintain and update your account information</li>
            <li>Notify us immediately of any unauthorized use</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Content and Intellectual Property</h2>
          <p className="text-muted-foreground">
            All content on Obelisk Learning, including courses, text, graphics, logos, and software, is the property of Obelisk Learning or its content suppliers and is protected by copyright and other intellectual property laws.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            In no event shall Obelisk Learning or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms of Service, please contact us at support@obelisklearning.com
          </p>
        </section>
      </div>
    </div>
  );
}

