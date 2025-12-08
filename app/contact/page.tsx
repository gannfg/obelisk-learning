export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">Contact Us</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-base sm:text-lg text-muted-foreground mb-6">
          Have questions or feedback? We'd love to hear from you!
        </p>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-4">
              For general inquiries, support, or partnership opportunities, please reach out to us.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Email:</strong> support@superteamstudy.com</p>
              <p><strong>Response Time:</strong> We typically respond within 24-48 hours</p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <p className="text-muted-foreground">
              If you're experiencing technical issues or have questions about your account, please include as much detail as possible in your message so we can assist you quickly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

