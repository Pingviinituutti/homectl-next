import { Button, Input, Modal } from 'react-daisyui';
import { useCallback, useState } from 'react';
import { useSaveSceneModalState } from '@/hooks/saveSceneModalState';
import { useWebsocket, useWebsocketState } from '@/hooks/websocket';
import { WebSocketRequest } from '@/bindings/WebSocketRequest';
import { SceneConfig } from '@/bindings/SceneConfig';
import { SceneDeviceState } from '@/bindings/SceneDeviceState';
import { findDevice } from '@/lib/device';
import { useSelectedDevices } from '@/hooks/selectedDevices';
import { SceneDevicesSearchConfig } from '@/bindings/SceneDevicesSearchConfig';

type Props = {
  visible: boolean;
  close: () => void;
};

const Component = (props: Props) => {
  const ws = useWebsocket();
  const state = useWebsocketState();

  const { setOpen: setSaveSceneModalOpen } = useSaveSceneModalState();

  const [_selectedDevices, setSelectedDevices] = useSelectedDevices();
  const selectedDevices = _selectedDevices.flatMap((d) => {
    const device = state !== null ? findDevice(state, d) : null;
    if (device !== null && device !== undefined) {
      return [device];
    }
    return [];
  });

  const { visible, close } = props;

  const [value, setValue] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setValue(newValue);
  }, []);

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const devicesByKey: (readonly [
        { integrationId: string; name: string },
        SceneDeviceState,
      ])[] = selectedDevices.flatMap((device) => {
        if ('Light' in device.state) {
          const light = device.state.Light;
          let color = { hue: 0, saturation: 0, value: 0 };

          if (light.color !== null && 'Hsv' in light.color) {
            color = light.color.Hsv;
          }

          const state: SceneDeviceState = {
            power: light.power,
            color: color as any,
            brightness: light.brightness,
            cct: null,
            transition_ms: null,
          };

          return [
            [
              {
                integrationId: device.integration_id,
                name: device.name,
              },
              state,
            ] as const,
          ];
        } else {
          return [];
        }
      });

      const devicesByIntegration: SceneDevicesSearchConfig = {};

      devicesByKey.forEach(([deviceKey, state]) => {
        if (devicesByIntegration[deviceKey.integrationId] === undefined) {
          devicesByIntegration[deviceKey.integrationId] = {};
        }

        devicesByIntegration[deviceKey.integrationId][deviceKey.name] = state;
      });

      const config: SceneConfig = {
        name: value,
        devices: devicesByIntegration,
        groups: null,
        hidden: false,
      };

      const msg: WebSocketRequest = {
        Message: {
          StoreScene: {
            scene_id: value,
            config,
          },
        },
      };

      const data = JSON.stringify(msg);
      ws?.send(data);
      setSaveSceneModalOpen(false);
      setSelectedDevices([]);
    },
    [selectedDevices, setSaveSceneModalOpen, setSelectedDevices, value, ws],
  );

  return (
    <Modal responsive open={visible} onClickBackdrop={close}>
      <Button
        size="sm"
        shape="circle"
        className="absolute right-2 top-2"
        onClick={close}
      >
        ✕
      </Button>
      <Modal.Header className="font-bold">{'Save new scene'}</Modal.Header>

      <form onSubmit={submit}>
        <Modal.Body>
          <label className="label">
            <span className="label-text">Scene name</span>
          </label>
          <Input onChange={handleChange} value={value} />
        </Modal.Body>

        <Modal.Actions>
          <Button type="submit" onClick={submit}>
            Save
          </Button>
        </Modal.Actions>
      </form>
    </Modal>
  );
};

export const SaveSceneModal = () => {
  const { open: saveSceneModalOpen, setOpen: setSaveSceneModalOpen } =
    useSaveSceneModalState();

  const closeSceneModal = useCallback(() => {
    setSaveSceneModalOpen(false);
  }, [setSaveSceneModalOpen]);

  return <Component visible={saveSceneModalOpen} close={closeSceneModal} />;
};
