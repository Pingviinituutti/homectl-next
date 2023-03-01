import { useSelectedDevices } from '@/hooks/selectedDevices';
import { Button } from 'react-daisyui';
import { X, Edit, ChevronLeft } from 'lucide-react';
import { useCallback } from 'react';
import { useDeviceModalState } from '@/hooks/deviceModalState';
import { usePathname, useRouter } from 'next/navigation';
import { useWebsocketState } from '@/hooks/websocket';

export const Navbar = () => {
  const router = useRouter();

  const pathname = usePathname();
  const state = useWebsocketState();

  let title = 'homectl';
  let back: string | null = null;

  if (pathname === '/') {
    title = 'Dashboard';
  } else if (pathname === '/map') {
    title = 'Map';
  } else if (pathname === '/groups') {
    title = 'Groups';
  } else if (pathname?.startsWith('/groups/')) {
    const groupId = pathname.split('/')[2];
    const group = (state?.groups ?? {})[groupId];
    const groupName = group?.name ?? '...';

    title = `Scenes for ${groupName}`;
    back = '/groups';
  }

  const [selectedDevices, setSelectedDevices] = useSelectedDevices();
  const { setState: setDeviceModalState, setOpen: setDeviceModalOpen } =
    useDeviceModalState();

  const clearSelectedDevices = useCallback(() => {
    setSelectedDevices([]);
  }, [setSelectedDevices]);

  const editSelectedDevices = useCallback(() => {
    setDeviceModalState(selectedDevices);
    setDeviceModalOpen(true);
  }, [selectedDevices, setDeviceModalOpen, setDeviceModalState]);

  const navigateBack = useCallback(() => {
    if (back) {
      router.replace(back);
    }
  }, [back, router]);

  return (
    <div className="navbar z-10 bg-base-100 bg-opacity-75 backdrop-blur">
      {back !== null && (
        <Button
          color="ghost"
          startIcon={<ChevronLeft />}
          onClick={navigateBack}
        />
      )}
      {selectedDevices.length === 0 ? (
        <a className="btn-ghost btn text-xl normal-case">{title}</a>
      ) : (
        <>
          <Button
            color="ghost"
            startIcon={<X />}
            onClick={clearSelectedDevices}
          />
          <a className="btn-ghost btn text-xl normal-case">
            {selectedDevices.length}{' '}
            {selectedDevices.length === 1 ? 'device' : 'devices'}
          </a>
          <div className="flex-1" />
          <Button
            color="ghost"
            startIcon={<Edit />}
            onClick={editSelectedDevices}
          />
        </>
      )}
    </div>
  );
};
