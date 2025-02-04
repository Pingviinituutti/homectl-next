// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { DeviceId } from './DeviceId';
import type { IntegrationId } from './IntegrationId';

export interface SceneDeviceLink {
  integration_id: IntegrationId;
  device_id: DeviceId | null;
  name: string | null;
  brightness: number | null;
}
