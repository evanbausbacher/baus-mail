import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">
          BausMail
        </h1>
        <p className="text-gray-600">
          A simple email client for managing Resend-powered domains
        </p>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Welcome to BausMail</h2>
          <p className="text-gray-600 mb-4">
            Phase 1: Foundation & Setup - Complete!
          </p>
          <div className="flex gap-2">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-2">Next Steps:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Install dependencies</li>
            <li>Run database migrations</li>
            <li>Start development server</li>
            <li>Begin Phase 2: Domain Management</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
