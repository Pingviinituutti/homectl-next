import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Card, Table } from 'react-daisyui';
import { useInterval } from 'usehooks-ts';
import { cachedPromise } from './cachedPromise';

type Trip = {
  routeShortName: string;
};

// SCHEDULED
// The trip information comes from the GTFS feed, i.e. no real-time update has been applied.

// UPDATED
// The trip information has been updated, but the trip pattern stayed the same as the trip pattern of the scheduled trip.

// CANCELED
// The trip has been canceled by a real-time update.

// ADDED
// The trip has been added using a real-time update, i.e. the trip was not present in the GTFS feed.

// MODIFIED
// The trip information has been updated and resulted in a different trip pattern compared to the trip pattern of the scheduled trip.

type RealtimeState =
  | 'SCHEDULED'
  | 'UPDATED'
  | 'CANCELED'
  | 'ADDED'
  | 'MODIFIED';

type StopTime = {
  scheduledDeparture: number;
  realtimeDeparture: number;
  realtime: boolean;
  realtimeState: RealtimeState;
  serviceDay: number;
  headsign: string;
  trip: Trip;
};

type Stop = {
  name: string;
  stoptimesWithoutPatterns?: StopTime[];
  stopTimesForPattern?: StopTime[];
};

type HslResponse = {
  data: {
    [stop: string]: Stop;
  };
  errors: any[];
};

const fetchCachedTrainSchedule = async (stops: string[] = [], patterns: string[] = []): Promise<Train[]> => {
  const body = '{'
    + stops.map((stop, i) => 
      `${`stop${i}:`} stop(id: "${stop}") {
        name
        ${
          patterns[i] ? ` stopTimesForPattern(id: "${patterns[i]}", numberOfDepartures: 5) {` : 'stoptimesWithoutPatterns {'
        }
          scheduledDeparture
          realtimeDeparture
          realtime
          realtimeState
          serviceDay
          headsign
          trip {
            routeShortName
          }
        }
      }`).join('\n')
  + '}';
  const json = await cachedPromise('trainScheduleCache' + stops.join(''), 1, async () => {
    // const query
    const res = await fetch(
      `https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql?digitransit-subscription-key=${process.env.NEXT_PUBLIC_DIGITRANSIT_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/graphql',
        },
        body: body,
      },
    );
    const json: HslResponse = await res.json();
    return json;
  });

  // console.log(JSON.stringify(json.data));

  if (json.errors) {
    return [];
  }

  const stopTimes = stops.map((_, i) => json.data['stop' + i].stoptimesWithoutPatterns || json.data['stop' + i].stopTimesForPattern).flat();
  const trainsToCatch = stopTimes.flatMap((st) => {
    if (st === undefined) return [];
    const secSinceMidnight = getSecSinceMidnight(new Date());
    const departureSecSinceMidnight = st.realtimeDeparture;

    const secUntilDeparture = departureSecSinceMidnight - secSinceMidnight;
    const minUntilDeparture = secUntilDeparture / 60;

    // in case the departure date of the vehicle is yesterday, the seconds will be calculated from yesterday too.
    // -> calculation above leads to next departure being in 24 * 60 = 1440 + minUntilDeparture minutes from now.
    // Easy fix with modulo because we can assume real-time departures never show departures that far away in the future. 
    const minUntilHomeDeparture = (Math.floor(minUntilDeparture)) % 1440;

    if (minUntilHomeDeparture < 0) {
      return [];
    }

    return [
      {
        minUntilHomeDeparture,
        name: st.trip.routeShortName,
        realtime: st.realtime,
        realtimeState: st.realtimeState,
      },
    ];
  });

  if (stops.length > 1) {
    trainsToCatch.sort((a, b) => a.minUntilHomeDeparture - b.minUntilHomeDeparture);
  }

  return trainsToCatch.filter(s => s.minUntilHomeDeparture > 0).slice(0, 5);
};

type Train = {
  minUntilHomeDeparture: number;
  name: string;
  realtime: boolean;
  realtimeState: RealtimeState;
};

function getSecSinceMidnight(d: Date) {
  const e = new Date(d);
  return ((d as any as number) - e.setHours(0, 0, 0, 0)) / 1000;
}

type TrainCardProps = {
  title?: string,
  stops?: string[],
  patterns?: string[],
}

export const TrainScheduleCard = ({ title = 'Train', stops = [], patterns = [] }: TrainCardProps) => {
  const [trains, setTrains] = useState<Train[]>([]);
  if (stops.length === 0) {
    return null;
  }

  useEffect(() => {
    let isSubscribed = true;

    const fetch = async () => {
      const trains = await fetchCachedTrainSchedule(stops, patterns);
      if (isSubscribed === true) {
        setTrains(trains);
      }
    };
    fetch();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useInterval(async () => {
    const trains = await fetchCachedTrainSchedule(stops, patterns);
    // if (trains.length > 0) {
    //   const sortedTrains = trains.toSorted((a, b) => a.minUntilHomeDepartur < b.minUntilDeparture);
    // }
    setTrains(trains);
  }, 5000);

  return (
    <Card compact className="col-span-2">
      <Card.Body className="shadow-lg">
        <Table>
          <Table.Head>
            <span>{title}</span>
            <span>Leaves in (min)</span>
          </Table.Head>
          <Table.Body>
            {trains.map((train, index) => {
              return (
                <Table.Row key={index}>
                  <span>{train.name}</span>
                  <span
                    className={clsx([
                      'text-2xl',
                      train.realtime ? 'font-extrabold' : '',
                    ])}
                  >
                    {train.minUntilHomeDeparture}
                  </span>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
};
