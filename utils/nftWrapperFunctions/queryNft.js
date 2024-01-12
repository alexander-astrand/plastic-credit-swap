const { createWalletAndKey } = require("../createWalletAndKey");

export async function queryNFTs(contractAddress, walletAddress) {
    const { client } = await createWalletAndKey();
    return await client.queryContractSmart(contractAddress, {
      tokens: { owner: walletAddress },
    });
  }