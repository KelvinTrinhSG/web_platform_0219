import Button from '@/components/button';
import { EventCategory, EventName } from '@/constants/event';
import { downloadClickAtom } from '@/store/web3/state';
import React from 'react';
import ReactGA from 'react-ga4';
import { useRecoilState } from 'recoil';
import { useConnect } from 'wagmi';
import { WalletType } from './WalletPopover';
import { toast } from '@/utils/toast';
import { saveConnectionState } from '@/hooks/user';

ReactGA.event({ category: EventCategory.Global, action: EventName.ToInvitation });

type WalletConnectProps = {
  setWalletType?: (type: WalletType) => void;
};
const handleWalletError = (error: any, walletType: string) => {
  const errorMessages: Record<string, string> = {
    meta_mask: "Please install MetaMask extension or check if it's unlocked",
    token_pocket: "Please install TokenPocket or check if it's unlocked",
    bitget_wallet: "Please install Bitget Wallet or check if it's unlocked",
    particle_network: 'Particle Network connection failed. Please try again.',
    wallet_connect: 'WalletConnect connection failed. Please try again.',
  };

  toast.error(errorMessages[walletType] || 'Connection failed. Please try again.');
};

function WalletConnect({ setWalletType }: WalletConnectProps) {
  const [downloadClick, setDownloadClick] = useRecoilState(downloadClickAtom);

  const { connect, connectors } = useConnect({
    onSuccess: (_, { connector }) => {
      saveConnectionState(connector.id);
      ReactGA.event({ category: EventCategory.Global, action: EventName.ConnectResult, label: 'success' });
    },
    onError: (error, { connector }) => {
      ReactGA.event({ category: EventCategory.Global, action: EventName.ConnectResult, label: 'failed' });

      const walletType = connector?.name?.toLowerCase().replace(/\s/g, '_') || 'unknown';

      // ✅ Gọi toast và xử lý lỗi cụ thể theo ví
      handleWalletError(error, walletType);

      // Mở link nếu là MetaMask không cài
      if (error.name === 'ConnectorNotFoundError' && connector?.name === 'MetaMask') {
        window.open('https://metamask.io');
      }
    },
  });

  /**
   * connectWallet
   * @param connector
   */
  const connectWallet = (connector: any | undefined) => {
    if (connector) {
      connect({ connector });
    }
  };

  const onConnectClick = (type: string, index: number) => {
    ReactGA.event({ category: EventCategory.Global, action: EventName.ConnectWallet, label: type });
    connectWallet(connectors[index]);
  };

  return (
    <div className="flex-center-y p-6">
      <h4 className="text-xl font-medium">Connect wallet</h4>
      <div className="mt-6 grid grid-cols-2 gap-3 px-4">
        <Button type="bordered" className="flex-center col-span-2 gap-2" onClick={() => onConnectClick('meta_mask', 0)}>
          <img className="h-7.5 w-7.5" src="/img/metamask@2x.png" alt="meta_mask" />
          <span className="text-sm">MetaMask</span>
        </Button>
        <Button type="bordered" className="flex-center gap-2" onClick={() => onConnectClick('token_pocket', 1)}>
          <img className="h-7.5 w-7.5" src="/img/tokenPocket.png" alt="TokenPocket" />
          <span className="text-sm">TokenPocket</span>
        </Button>
        <Button type="bordered" className="flex-center gap-2" onClick={() => onConnectClick('bitget_wallet', 2)}>
          <img className="h-7.5 w-7.5" src="/img/bitgetWallet.png" alt="BitgetWallet" />
          <span className="text-sm">Bitget Wallet</span>
        </Button>
        <Button type="bordered" className="flex-center gap-2 px-6" onClick={() => onConnectClick('particle_network', 3)}>
          <img className="h-7.5 w-7.5" src="/img/particleNetwork.png" alt="ParticleNetwork" />
          <span className="whitespace-nowrap text-sm">Particle Network</span>
        </Button>
        <Button type="bordered" className="flex-center gap-2" onClick={() => onConnectClick('wallet_connect', 4)}>
          <img className="h-7.5 w-7.5" src="/img/walletconnet.png" alt="wallet_connect" />
          <span className="text-sm">WalletConnect</span>
        </Button>
      </div>
      <div className="mt-4 px-4 text-xs text-gray">
        {downloadClick ? 'Please refresh page after installation. Re-install ' : "Don't have one? "}
        <span
          className="cursor-pointer text-blue"
          onClick={() => {
            setDownloadClick(true);
            setWalletType?.(WalletType.DOWNLOAD);
          }}
        >
          click here
        </span>
      </div>
    </div>
  );
}

export default React.memo(WalletConnect);
