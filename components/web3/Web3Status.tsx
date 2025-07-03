import React, { useEffect, useRef, useState } from 'react';
import { polygon, linea, bsc } from 'wagmi/chains';
import { Platform } from '@/constants';
import { useRouter } from 'next/router';
import Button from '@/components/button';
import Popover from '@/components/popover';
import { watchAccount } from '@wagmi/core';
import WalletPopover from './WalletPopover';
import Web3StatusInner from './Web3StatusInner';
import { useMutationLogin } from '@/hooks/user';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { getAccessToken } from '@/utils/authorization';
import { posterCaptureAtom } from '@/store/poster/state';
import { isConnectPopoverOpen } from '@/store/web3/state';
import PosterButton from '@/components/poster/PosterButton';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useSignInWithEthereum } from '@/hooks/useSignInWithEthereum';
import { accessTokenAtom } from '@/store/user/state';
import { getLastConnectedWallet } from '@/hooks/user';
import { useConnect } from 'wagmi';

function Web3Status() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const { mutate } = useMutationLogin();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { connect, connectors } = useConnect();

  const setAccessToken = useSetRecoilState(accessTokenAtom);
  const unwatchAccount = useRef<() => void>();
  const [isConnecting, setIsConnecting] = useState(false); // ✅ Loading state
  const [isOpen, setIsOpen] = useRecoilState(isConnectPopoverOpen);
  const posterCapture = useRecoilValue(posterCaptureAtom);

  const supportedNetworks = [polygon, linea, bsc]; // ✅ Supported networks
  const isNetworkSupported = supportedNetworks.some((network) => network.id === chain?.id);

  const { signInWithEthereum } = useSignInWithEthereum({
    onSuccess: (args) => mutate({ ...args, platform: Platform.USER }),
  });

  useEffect(() => {
    const accessToken = getAccessToken({ address });
    setAccessToken(accessToken);
  }, [address, setAccessToken]);

  useEffect(() => {
    const lastWalletId = getLastConnectedWallet();
    if (!lastWalletId) return;

    const connector = connectors.find((c) => c.id === lastWalletId);
    if (connector) {
      setIsConnecting(true); // ✅ Optional UX
      connect({ connector }).catch(() => setIsConnecting(false));
    }
  }, [connect, connectors]);

  useAccount({
    onConnect({ address, isReconnected }) {
      unwatchAccount.current = watchAccount(({ isConnected, address }) => {
        const accessToken = getAccessToken({ address });
        if (address && isConnected && !accessToken) {
          signInWithEthereum(address).then(() => setIsConnecting(false));
        }
      });
      if (isReconnected || !address) return;
      signInWithEthereum(address).then(() => setIsConnecting(false));
    },
    onDisconnect() {
      unwatchAccount.current?.();
    },
  });

  if (!isMounted) return null;

  if (router.pathname === '/gamer/[address]') {
    return posterCapture ? <PosterButton /> : null;
  }

  if (isConnected) {
    if (!isNetworkSupported) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-500">Wrong Network</span>
          <Button size="small" type="error" className="h-10" onClick={() => switchNetwork?.(polygon.id)}>
            Switch to Polygon
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {router.pathname === '/gamer' && posterCapture && <PosterButton />}
        <div className="flex rounded-full bg-[#44465F]/60 text-sm">
          <Web3StatusInner />
        </div>
        <span className="text-xs text-green-400">Connected: {chain?.name}</span>
      </div>
    );
  }

  return (
    <div>
      <Popover
        open={isOpen}
        onOpenChange={(op) => {
          setIsOpen(op);
          if (op) setIsConnecting(true);
        }}
        render={({ close }) => (
          <WalletPopover
            close={() => {
              setIsConnecting(false);
              close();
            }}
          />
        )}
      >
        <Button size="small" type="gradient" className="h-10 w-[120px]" disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </Popover>
    </div>
  );
}

export default Web3Status;
