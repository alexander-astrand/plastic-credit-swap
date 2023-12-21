export const state = () => ({
    walletAddress: null
  });
  
  export const mutations = {
    SET_WALLET_ADDRESS(state, address) {
      state.walletAddress = address;
    }
  };
  
  export const actions = {
    async connectWallet({ commit }) {
      if (window.keplr && window.getOfflineSigner) {
        const chainId = "circulus-1";
        await window.keplr.enable(chainId);
        const offlineSigner = window.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        commit('SET_WALLET_ADDRESS', accounts[0].address);
        // Further logic to interact with the blockchain
      } else {
        alert("Please install Keplr extension");
      }
    }
  };
  