const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { Tendermint37Client } = require("@cosmjs/tendermint-rpc");
const DirectSecp256k1Wallet = require('@cosmjs/proto-signing').DirectSecp256k1Wallet;
const crypto = require('crypto');
const app = express();
const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK({ pinataJWTKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhMzIzMzhjNS1hNzBiLTRhZmMtYTNkYS0yODU1Y2U2NjQxNWQiLCJlbWFpbCI6InBpbmF0YUBhc3RyYW5kLnh5eiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0NzUwMGU3NDUxMjg5YThmYmE3ZiIsInNjb3BlZEtleVNlY3JldCI6Ijk3MTQ3NGMzMGQ4ZjI4YWQwNDg0ODc4NzMwYWI3NDUxNWEzNmNkZDkyYWVmY2VlMTk1ODk4ZWQwMDljNjUzMjkiLCJpYXQiOjE3MDM3MjI5MTV9.xFfwT3wysY99clpdMNi1epfosLGip5XpP3Nlm8XzQro'});
const { GasPrice } = require('@cosmjs/stargate');
require('dotenv').config();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

  const privateKeyHex = process.env.PRIVATE_KEY; // Replace with your actual private key in hex format
  //const privateKey = Buffer.from(privateKeyHex, 'hex');

  const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

  
  async function mintNFT(contractAddress, mintMsg, rpcEndpoint) {
      const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'empower');
      const [firstAccount] = await wallet.getAccounts();
      console.log("firstAccount: ", firstAccount);
      const gasPrice = GasPrice.fromString("0.025umpwr");
      const tmClient = await Tendermint37Client.connect(rpcEndpoint);
      const client = await SigningCosmWasmClient.createWithSigner(tmClient, wallet, { gasPrice });
      return await client.execute(firstAccount.address, contractAddress, mintMsg, "auto");
  }

  async function queryNFTs(contractAddress, rpcEndpoint, walletAddress) {
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'empower');
    const [firstAccount] = await wallet.getAccounts();
    console.log("firstAccount: ", firstAccount);
    const gasPrice = GasPrice.fromString("0.025umpwr");
    const tmClient = await Tendermint37Client.connect(rpcEndpoint);
    const client = await SigningCosmWasmClient.createWithSigner(tmClient, wallet, { gasPrice });
    return await client.queryContractSmart(contractAddress, {tokens: {owner: walletAddress}});
  }

  async function burnNft(token_id) {
    const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, 'empower');
    const [firstAccount] = await wallet.getAccounts();
    console.log("firstAccount: ", firstAccount);
    const gasPrice = GasPrice.fromString("0.025umpwr");
    const tmClient = await Tendermint37Client.connect("https://testnet.empowerchain.io:26659");
    const client = await SigningCosmWasmClient.createWithSigner(tmClient, wallet, { gasPrice });
    return await client.execute(firstAccount.address, "empower10qt8wg0n7z740ssvf3urmvgtjhxpyp74hxqvqt7z226gykuus7eq0su4x5", {burn: {token_id: token_id}}, "auto");
  }

function extractIpfsHashFromResponse(plasticCreditResponse) {
    if (plasticCreditResponse.creditCollection.metadataUris && plasticCreditResponse.creditCollection.metadataUris.length > 0) {
        const ipfsUri = plasticCreditResponse.creditCollection.metadataUris[0];
        return ipfsUri.replace('ipfs://', '');
    }
    return null; // Return null if no IPFS hash is found
}

app.post('/fetch-and-mint-plastic-credit', async (req, res) => {
    const { denom, amountToWrap, address } = req.body;

    if (!denom || amountToWrap === undefined || !address) {
        return res.status(400).send('Denom, amountToWrap, and address are required');
    }

    try {
        const { empowerchain } = require('@empower-plastic/empowerjs');
        const rpcQueryClient = await empowerchain.ClientFactory.createRPCQueryClient({
            rpcEndpoint: "https://testnet.empowerchain.io:26659",
        });

        const plasticCreditResponse = await rpcQueryClient.empowerchain.plasticcredit.creditCollection({ denom });
        const ipfsHash = extractIpfsHashFromResponse(plasticCreditResponse);
        let ipfsData = {};
        console.log("ipfsHash: ", ipfsHash);
        if (ipfsHash) {
            const ipfsHash2 = `https://ipfs.empowerchain.io/ipfs/${ipfsHash}`;
            const ipfsResponse = await axios.get(`https://ipfs.empowerchain.io/ipfs/${ipfsHash}`);
            ipfsData = ipfsResponse.data;
            console.log('IPFS metadata:', ipfsData);
            console.log(ipfsData.credit_props[1].content[0].url);

            const metadata = {
                name: "Wrapped Plastic Credits",
                description: `${amountToWrap} wrapped plastic credits from collection ${denom}`,
                image: ipfsData.credit_props[1].content[0].url,
                attributes: [
                  { trait_type: "Collection Metadata", value: ipfsHash2 },
                  { trait_type: "Wrapped Plastic Credits", value: amountToWrap },
                ],
              };
              const pinataResponse = await pinata.pinJSONToIPFS(metadata);
              console.log("Pinata link: ", pinataResponse);
              const ipfsLink = `https://ipfs.io/ipfs/${pinataResponse.IpfsHash}`;
              

            let token_id = crypto.randomBytes(16).toString('hex');
            console.log("token_id: ", token_id);
            const mintMsg = {
                mint: {
                    owner: address,
                    token_uri: ipfsLink,
                    token_id: token_id,
                    from: address,
                    denom: denom,
                    amount: Number(amountToWrap),
                }
            };
            //res.send({ mintMsg, metadata, ipfsData });
            console.log('Minting NFT with message:', mintMsg);
            try {
                const mintResult = await mintNFT("empower10qt8wg0n7z740ssvf3urmvgtjhxpyp74hxqvqt7z226gykuus7eq0su4x5", mintMsg, "https://testnet.empowerchain.io:26659");
                const mintResultSerialized = JSON.parse(JSON.stringify(mintResult, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ));
            
            res.json({ mintTransactionResult: mintResultSerialized });
            } catch (mintError) {
                console.error('Error minting NFT:', mintError);
                res.status(500).send('Error minting NFT');
            }
        } else {
            res.status(404).send('IPFS hash not found');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/unwrap-nft', async (req, res) => {
    const { token_id } = req.body;

    if (!token_id) {
        return res.status(400).send('Token ID is required');
    }
    try {
        const burnResult = await burnNft(token_id);
        const burnResultSerialized = JSON.parse(JSON.stringify(burnResult, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
        console.log("burnResult: ", burnResultSerialized);
        res.json({ burnResult: burnResultSerialized });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/query-nfts', async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).send('Token ID is required');
    }
    try {
        const queryResult = await queryNFTs("empower10qt8wg0n7z740ssvf3urmvgtjhxpyp74hxqvqt7z226gykuus7eq0su4x5", "https://testnet.empowerchain.io:26659", walletAddress);
        const queryResultSerialized = JSON.parse(JSON.stringify(queryResult, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
        console.log("queryResult: ", queryResultSerialized);
        res.json({ queryResult: queryResultSerialized });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = app;
