const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Tendermint37Client } = require("@cosmjs/tendermint-rpc");
const { GasPrice } = require("@cosmjs/stargate");
const DirectSecp256k1Wallet =
  require("@cosmjs/proto-signing").DirectSecp256k1Wallet;

export async function createWalletAndKey() {
    const privateKeyHex = process.env.PRIVATE_KEY;
    const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, "empower");
    const gasPrice = GasPrice.fromString("0.025umpwr");
    const tmClient = await Tendermint37Client.connect(process.env.NUXT_ENV_RPC_ENDPOINT);
    const client = await SigningCosmWasmClient.createWithSigner(
      tmClient,
      wallet,
      { gasPrice }
    );
    const [firstAccount] = await wallet.getAccounts();
    return { firstAccount, client };
  }