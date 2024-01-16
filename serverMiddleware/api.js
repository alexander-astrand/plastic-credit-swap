const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const pinataSDK = require("@pinata/sdk");
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_API_KEY });
const { extractIpfsHashFromResponse } = require("../utils/nftWrapperFunctions/extractIpfs");
const { mintNFT } = require("../utils/nftWrapperFunctions/mintNft");
const { burnNft } = require("../utils/nftWrapperFunctions/burnNft");
const { queryNFTs } = require("../utils/nftWrapperFunctions/queryNft");

const app = express();
app.use(bodyParser.json());

app.post("/fetch-and-mint-plastic-credit", async (req, res) => {
  const { denom, amountToWrap, address } = req.body;

  if (!denom || amountToWrap === undefined || !address) {
    return res
      .status(400)
      .send("Denom, amountToWrap, and address are required");
  }

  try {
    const { empowerchain } = require("@empower-plastic/empowerjs");
    const rpcQueryClient =
      await empowerchain.ClientFactory.createRPCQueryClient({
        rpcEndpoint: process.env.NUXT_ENV_RPC_ENDPOINT,
      });

    const plasticCreditResponse =
      await rpcQueryClient.empowerchain.plasticcredit.creditCollection({
        denom,
      });
    const ipfsHash = extractIpfsHashFromResponse(plasticCreditResponse);
    let ipfsData = {};
    console.log("ipfsHash: ", ipfsHash);
    if (ipfsHash) {
      const ipfsHash2 = `https://ipfs.empowerchain.io/ipfs/${ipfsHash}`;
      const ipfsResponse = await axios.get(
        `https://ipfs.empowerchain.io/ipfs/${ipfsHash}`
      );
      ipfsData = ipfsResponse.data;
      console.log("IPFS metadata:", ipfsData);
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

      let token_id = crypto.randomBytes(16).toString("hex");
      console.log("token_id: ", token_id);
      const mintMsg = {
        mint: {
          owner: address,
          token_uri: ipfsLink,
          token_id: token_id,
          from: address,
          denom: denom,
          amount: Number(amountToWrap),
        },
      };
      //res.send({ mintMsg, metadata, ipfsData });
      console.log("Minting NFT with message:", mintMsg);
      console.log(process.env.NUXT_ENV_CONTRACT_ADDRESS);
      try {
        const mintResult = await mintNFT(process.env.NUXT_ENV_CONTRACT_ADDRESS, mintMsg);
        const mintResultSerialized = JSON.parse(
          JSON.stringify(mintResult, (key, value) =>
            typeof value === "bigint" ? value.toString() : value
          )
        );

        res.json({ mintTransactionResult: mintResultSerialized });
      } catch (mintError) {
        console.error("Error minting NFT:", mintError);
        res.status(500).send("Error minting NFT");
      }
    } else {
      res.status(404).send("IPFS hash not found");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/unwrap-nft", async (req, res) => {
  const { token_id } = req.body;

  if (!token_id) {
    return res.status(400).send("Token ID is required");
  }
  try {
    const burnResult = await burnNft(process.env.NUXT_ENV_CONTRACT_ADDRESS, token_id);
    const burnResultSerialized = JSON.parse(
      JSON.stringify(burnResult, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    console.log("burnResult: ", burnResultSerialized);
    res.json({ burnResult: burnResultSerialized });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/query-nfts", async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).send("Token ID is required");
  }
  try {
    const queryResult = await queryNFTs(
      process.env.NUXT_ENV_CONTRACT_ADDRESS,
      walletAddress
    );
    const queryResultSerialized = JSON.parse(
      JSON.stringify(queryResult, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    console.log("queryResult: ", queryResultSerialized);
    res.json({ queryResult: queryResultSerialized });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
