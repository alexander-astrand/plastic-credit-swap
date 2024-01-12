const { createWalletAndKey } = require("../createWalletAndKey");

export async function mintNFT(contractAddress, mintMsg) {
  const { firstAccount, client } = await createWalletAndKey();
  return await client.execute(
    firstAccount.address,
    contractAddress,
    mintMsg,
    "auto"
  );
}
