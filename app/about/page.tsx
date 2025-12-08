export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8">About Superteam Study</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-base sm:text-lg text-muted-foreground mb-6">
          Superteam Study is a modern platform designed to help developers master cutting-edge technologies through expert-led classes and hands-on practice.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p className="text-muted-foreground mb-4">
          We believe in making high-quality technical education accessible to everyone. Our platform combines structured learning paths with interactive coding environments to provide a comprehensive learning experience.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">What We Offer</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>Expert-led classes on modern development technologies</li>
          <li>Interactive coding environments for hands-on practice</li>
          <li>Gamified learning experience with XP and achievements</li>
          <li>Progress tracking and personalized learning paths</li>
        </ul>
      </div>
    </div>
  );
}

