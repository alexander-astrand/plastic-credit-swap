const { createWalletAndKey } = require("../createWalletAndKey");

export async function burnNft(contractAddress, token_id) {
  const { firstAccount, client } = await createWalletAndKey();
  return await client.execute(
    firstAccount.address,
    contractAddress,
    { burn: { token_id: token_id } },
    "auto"
  );
}
