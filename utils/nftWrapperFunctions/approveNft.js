const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Tendermint37Client } = require("@cosmjs/tendermint-rpc");
const { GasPrice } = require("@cosmjs/stargate");

export async function approveNFT(selectedNFTId, offlineSigner, walletAddress) {
    try {
      const approveMsg = {
        approve: {
          spender: process.env.NUXT_ENV_ADMIN_ADDRESS, // Admin address
          token_id: selectedNFTId, // Token ID to approve
          expires: null,
        },
      };
      const gasPrice = GasPrice.fromString("0.025umpwr");
      const tmClient = await Tendermint37Client.connect(
        process.env.NUXT_ENV_RPC_ENDPOINT
      );
      const client = await SigningCosmWasmClient.createWithSigner(
        tmClient,
        offlineSigner,
        { gasPrice }
      );
      // Send the transaction
      const result = await client.execute(
        walletAddress,
        process.env.NUXT_ENV_CONTRACT_ADDRESS, // Contract address
        approveMsg,
        "auto" // Automatically set fee
      );
      console.log("Transaction result:", result);
    } catch (error) {
      console.error("Error during approval: " + error);
      throw error;
    }
  }