import { Device } from '@/bindings/Device';
import { DevicesState } from '@/bindings/DevicesState';
import { useWebsocketState } from '@/hooks/websocket';
import { Card } from 'react-daisyui';

type CardProp = {
  sensorName: string
}

export const SensorDisplayCard = (props: CardProp) => {
  const state = useWebsocketState();

  const devices: Device[] = Object.values(
    state?.devices ?? ({} as DevicesState),
  );
  
  // @ts-ignore
  const value = (devices.find(d => d.name === props.sensorName)?.state?.Sensor?.Temperature?.value / 100)?.toFixed(1);

  return (
    <Card compact className="col-span-2">
      <Card.Body className="flex-col items-center justify-center overflow-x-auto shadow-lg">
        <span className="text-2xl">{value} °C</span>
        <span>Inside temperature</span>
      </Card.Body>
    </Card>
  );
};
