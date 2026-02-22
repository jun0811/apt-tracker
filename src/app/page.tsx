import Dashboard from '@/components/Dashboard';
import { ListingsData } from '@/lib/types';

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data: ListingsData = require('../../data/listings.json');

  return <Dashboard data={data} />;
}
