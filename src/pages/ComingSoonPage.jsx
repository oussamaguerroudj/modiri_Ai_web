import { Construction } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function ComingSoonPage({ title, phase }) {
  return (
    <div className="panel flex min-h-[60vh] items-center justify-center p-10">
      <EmptyState
        icon={Construction}
        title={`${title} — coming in Phase ${phase}`}
        description="This module's UI hasn't been built yet in this delivery, but the backend endpoints it will use already exist and work today."
      />
    </div>
  );
}
