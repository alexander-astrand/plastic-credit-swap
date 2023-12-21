export default async ({ store }) => {
    if (process.client) {
      window.onKeplrLoad = async () => {
        if (window.keplr) {
          // Put your Keplr integration logic here
          // For example, enabling the wallet for a specific chain
          const chainId = "YOUR_CHAIN_ID";
          await window.keplr.enable(chainId);
          const offlineSigner = window.getOfflineSigner(chainId);
          // ... more logic to interact with the wallet
        }
      };
  
      if (document.readyState === "complete") {
        window.onKeplrLoad();
      } else {
        window.addEventListener("load", window.onKeplrLoad);
      }
    }
  };
  