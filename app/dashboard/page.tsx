'use client';

import { ClockCard } from './ClockCard';
import { TrainScheduleCard } from './TrainScheduleCard';
import { WeatherCard } from './WeatherCard';

export default function Page() {
  const titles = process.env.NEXT_PUBLIC_HSL_CARD_TITLES?.split(' ') || [];
  const stops = process.env.NEXT_PUBLIC_HSL_STOPS?.split(' ').map(t => t.split(',')) || [];
  const patterns = process.env.NEXT_PUBLIC_HSL_PATTERNS?.split(' ').map(p => p.split(',').map(p => p === '_' ? '' : p)) || [];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 sm:mx-16 justify-center">
      <div className="col-span-2 grid grid-cols-2 gap-2">
        <ClockCard />
        <WeatherCard />
      </div>  
      {titles.map((t, i) => <TrainScheduleCard title={t} stops={stops[i]} patterns={patterns[i]} key={`hsl-card-${i}`} />)}
    </div>
  );
}
