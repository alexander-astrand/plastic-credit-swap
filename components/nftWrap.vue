<template>
  <div class="wrapPage">
    <button @click="this.grantAuthorization">HALLOOOOOOO</button>
    <h1 class="mainTitle">Plastic Credit NFT Wrapper</h1>
    <div class="wrapBox">
      <div v-if="loading" class="loading">
        <rotate-loader
          :loading="loading"
          :color="color"
          :size="size"
        ></rotate-loader>
      </div>
      <div v-if="!loading">
        <div class="tabs">
          <button
            :class="{ selectedTab: currentTab === 'wrapper' }"
            @click="currentTab = 'wrapper'"
          >
            Wrapper
          </button>
          <button
            :class="{ selectedTab: currentTab === 'unwrapper' }"
            @click="currentTab = 'unwrapper'"
          >
            Unwrapper
          </button>
        </div>
        <div v-if="walletAddress == null">
          <h2>Sign in with wallet</h2>
        </div>
        <div v-if="walletAddress !== null">
          <div v-if="currentTab === 'wrapper'">
            <p class="collectionText">
              Choose which credit collection to wrap from:
            </p>
            <div class="dropdownBox">
              <select class="dropDown" v-model="selectedId">
                <option disabled value="">Please select one</option>
                <option
                  v-for="(item, index) in creditBalances"
                  :key="index"
                  :value="index"
                  v-if="item.amountActive !== '0'"
                >
                  {{ item.creditCollection.denom }}
                </option>
              </select>
            </div>
            <div class="amountBox" v-if="selectedId !== null">
              <p>Amount avaliable to wrap: {{ selectedActiveAmount }}</p>
              <p>Select amount to wrap:</p>
              <input
                type="number"
                v-model="selectedAmount"
                min="1"
                :max="selectedMaxAmount"
              />
              <button @click="wrapNFT">Wrap NFT</button>
            </div>
            <div class="error" v-if="error">Error: {{ error }}</div>
          </div>

          <div v-if="currentTab === 'unwrapper'">
            <h2>Choose which NFT to unwrap (TokenID):</h2>

            <!-- Dropdown for selecting NFT -->
            <div class="dropdownBox">
              <select class="dropDown" v-model="selectedNFTId">
                <option disabled value="">Please select an NFT</option>
                <option v-for="nftId in nfts" :key="nftId" :value="nftId">
                  {{ nftId }}
                </option>
              </select>
            </div>
            <!-- Unwrap Button -->
            <button v-if="selectedNFTId !== null" @click="unwrapNFT">
              Unwrap
            </button>

            <!-- Display error message if any -->
            <div class="error" v-if="error">Error: {{ error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { request, gql } from "graphql-request";
import { watch } from "vue";
import RotateLoader from "vue-spinner/src/RotateLoader.vue";
import Swal from "sweetalert2";
import { ref } from "vue";
import {
  cosmos,
  empowerchain,
  getSigningTM37EmpowerchainClient,
} from "@empower-plastic/empowerjs";
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Tendermint37Client } = require("@cosmjs/tendermint-rpc");
const { GasPrice } = require("@cosmjs/stargate");

const { transferCredits } =
  empowerchain.plasticcredit.MessageComposer.withTypeUrl;

export default {
  components: {
    RotateLoader,
  },

  data() {
    return {
      creditBalances: [],
      error: null,
      selectedId: null,
      selectedAmount: 1, // default amount
      selectedNFTId: null,
      nfts: [],
      currentTab: "wrapper",
      loading: false, // Set this to true or false based on your condition
      color: "red", // Color of the spinner
      size: "15px", // Size of the spinner
      denom: ref(""),
      amountToWrap: ref(""),
      offlineSigner: window.getOfflineSigner("circulus-1"),
    };
  },

  computed: {
    walletAddress() {
      return this.$store.state.walletAddress;
    },
    selectedActiveAmount() {
      return this.selectedId !== null
        ? this.creditBalances[this.selectedId].amountActive
        : "";
    },
    selectedMaxAmount() {
      if (this.selectedId !== null) {
        return this.creditBalances[this.selectedId].amountActive;
      }
      return 0;
    },
    // selectedNFTDetails() {
    //   console.log(this.nfts.find(nft => nft.id === this.selectedNFTId));
    //   console.log("nfts: " + this.nfts);
    //   console.log("selectedNFTId: " + this.selectedNFTId);
    //   return this.nfts.find(nft => nft.id === this.selectedNFTId);
    //   // Logic to return details of the selected NFT
    // },
  },

  mounted() {
    watch(
      () => this.walletAddress,
      (newAddress, oldAddress) => {
        if (newAddress && newAddress !== oldAddress) {
          this.fetchGraphQLData();
          this.queryNFTs();
        }
      },
      { immediate: true }
    );
  },

  methods: {
    async transferPlasticCredits() {
      console.log("transfering plastic credits: ");
      try {
        const transferCreditsMsg = transferCredits({
          from: this.walletAddress,
          to: "empower19247whxe6etzfdj3l6ye6hwfa3glys3pkdjp4x",
          denom: this.denom,
          amount: this.amountToWrap,
          retire: false,
          retiringEntityName: "",
          retiringEntityAdditionalData: "",
        });

        console.log("transferCreditsMsg: " + transferCreditsMsg);
        console.log(window.getOfflineSigner("circulus-1"));
        const chainClient = await getSigningTM37EmpowerchainClient({
          rpcEndpoint: "https://testnet.empowerchain.io:26659",
          signer: window.getOfflineSigner("circulus-1"),
        });
        const fee = {
          gas: "200000",
          amount: [{ amount: "1000000", denom: "umpwr" }],
        };
        const response = await chainClient.signAndBroadcast(
          this.walletAddress,
          [transferCreditsMsg],
          fee
        );
        if (response && !response.code) {
          console.log(response);
          console.log("Credits transferred successfully");
        } else {
          throw new Error("Transfering credits failed " + response.rawLog);
        }
      } catch (error) {
        console.log("Credit transfer failed: " + error);
        throw error;
      }
    },

    // async grantAuthorization() {
    //   const client = await getSigningTM37EmpowerchainClient({
    //     rpcEndpoint: "https://testnet.empowerchain.io:26659",
    //     signer: this.offlineSigner,
    //   });
    //   const w = empowerchain.plasticcredit.TransferAuthorization.fromPartial({
    //     denom: "PCRD/00710LPVHVM3WGX000000115",
    //     maxCredits: "1",
    //   });
    //   const authz = cosmos.authz.v1beta1.MessageComposer.withTypeUrl.grant({
    //     granter: this.walletAddress,
    //     grantee: "empower1y2cc50x64vslpqsmz8x2tcj8h3w0l6mpx87739",
    //     grant: {
    //       authorization: {
    //         typeUrl: "/empowerchain.plasticcredit.TransferAuthorization",
    //         value:
    //           empowerchain.plasticcredit.TransferAuthorization.encode(
    //             w
    //           ).finish(),
    //       },
    //     },
    //   });

    //   await client.signAndBroadcast(this.walletAddress, [authz], {
    //     amount: [{ amount: "100000", denom: "umpwr" }],
    //     gas: "200000",
    //   });
    // },

    async grantAuthorization() {
      const client = await getSigningTM37EmpowerchainClient({
        rpcEndpoint: "https://testnet.empowerchain.io:26659",
        signer: this.offlineSigner,
      });

      // GenericAuthorization
      const genericAuthz =
        cosmos.authz.v1beta1.GenericAuthorization.fromPartial({
          msg: "/cosmos.bank.v1beta1.MsgSend", // Or any other message type you wish to authorize
        });

      const authz = cosmos.authz.v1beta1.MessageComposer.withTypeUrl.grant({
        granter: this.walletAddress,
        grantee: "empower1y2cc50x64vslpqsmz8x2tcj8h3w0l6mpx87739",
        grant: {
          authorization: {
            typeUrl: "/cosmos.authz.v1beta1.GenericAuthorization",
            value:
              cosmos.authz.v1beta1.GenericAuthorization.encode(
                genericAuthz
              ).finish(),
          },
        },
      });

      await client.signAndBroadcast(this.walletAddress, [authz], {
        amount: [{ amount: "100000", denom: "umpwr" }],
        gas: "200000",
      });
    },

    async approveNFT() {
      try {
        const approveMsg = {
          approve: {
            spender: "empower1y2cc50x64vslpqsmz8x2tcj8h3w0l6mpx87739", // Address to be approved
            token_id: this.selectedNFTId, // Token ID to approve
            expires: null,
          },
        };
        const gasPrice = GasPrice.fromString("0.025umpwr");
        const tmClient = await Tendermint37Client.connect(
          "https://testnet.empowerchain.io:26659"
        );
        const client = await SigningCosmWasmClient.createWithSigner(
          tmClient,
          this.offlineSigner,
          { gasPrice }
        );
        // Send the transaction
        const result = await client.execute(
          this.walletAddress,
          "empower1eyfccmjm6732k7wp4p6gdjwhxjwsvje44j0hfx8nkgrm8fs7vqfs68uyhw", // Contract address
          approveMsg,
          "auto" // Automatically set fee
        );
        console.log("Transaction result:", result);
      } catch (error) {
        console.error("Error during approval: " + error);
        throw error;
      }
    },

    // async addChainToKeplr() {
    //   if (!window.getOfflineSigner || !window.keplr) {
    //     alert("Please install keplr extension");
    //   } else {
    //     try {
    //       await window.keplr.experimentalSuggestChain({
    //         chainId: "emp-devnet-1",
    //         chainName: "EmpowerChain Local Server",
    //         rpc: "tpc://0.0.0.0:26657",
    //         rest: "http://0.0.0.0:1317",
    //         bip44: {
    //           coinType: 118,
    //         },
    //         bech32Config: {
    //           bech32PrefixAccAddr: "empower",
    //           bech32PrefixAccPub: "empower" + "pub",
    //           bech32PrefixValAddr: "empower" + "valoper",
    //           bech32PrefixValPub: "empower" + "valoperpub",
    //           bech32PrefixConsAddr: "empower" + "valcons",
    //           bech32PrefixConsPub: "empower" + "valconspub",
    //         },
    //         currencies: [
    //           {
    //             coinDenom: "MPWR",
    //             coinMinimalDenom: "umpwr",
    //             coinDecimals: 6,
    //             coinGeckoId: "mpwr",
    //           },
    //         ],
    //         feeCurrencies: [
    //           {
    //             coinDenom: "MPWR",
    //             coinMinimalDenom: "umpwr",
    //             coinDecimals: 6,
    //             gasPriceStep: {
    //               low: 0.01,
    //               average: 0.025,
    //               high: 0.04,
    //             },
    //           },
    //         ],
    //         stakeCurrency: {
    //           coinDenom: "MPWR",
    //           coinMinimalDenom: "umpwr",
    //           coinDecimals: 6,
    //         },
    //       });

    //       alert("Chain added to Keplr");
    //     } catch (error) {
    //       console.error("Error adding chain: ", error);
    //     }
    //   }
    // },

    async fetchGraphQLData() {
      if (!this.walletAddress) {
        this.error = "Wallet address is not connected.";
        return;
      }
      this.loading = true;

      const query = gql`
        query Wallet($id: String!) {
          wallet(id: $id) {
            creditBalances {
              nodes {
                amountActive
                creditCollection {
                  denom
                  metadataUris {
                    nodes {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const response = await request(
          "https://testnet.empowerchain.io:3000/",
          query,
          {
            id: this.walletAddress,
          }
        );
        console.log(response);
        this.creditBalances = response.wallet.creditBalances.nodes;
      } catch (error) {
        this.error = error.message;
      }
      this.loading = false;
    },

    async wrapNFT() {
      //await this.grantAuthorization()

      this.loading = true;
      if (this.selectedId === null) {
        this.error = "Please select a credit collection.";
        return;
      }

      const selectedCollection = this.creditBalances[this.selectedId];
      if (!selectedCollection) {
        this.error = "Selected credit collection not found.";
        return;
      }

      let denom = selectedCollection.creditCollection.denom;
      let amountToWrap = this.selectedActiveAmount; // Ensure this is bound correctly
      const address = this.walletAddress;

      try {
        const result = await this.$axios.post(
          "/api/fetch-and-mint-plastic-credit",
          {
            denom,
            amountToWrap,
            address,
          }
        );
        console.log(result);
        Swal.fire({
          title: "Congratulations!",
          text: "You wrapped the Plastic Credits!",
          icon: "success",
        });
        // Handle the response as needed
      } catch (error) {
        console.error("Error sending data to the server", error);
        this.error = "Failed to send data to the server.";
      }
      this.fetchGraphQLData();
      this.loading = false;
    },

    async unwrapNFT() {
      this.loading = true;

      try {
        // First, get the approval
        await this.approveNFT();

        // Then proceed with the unwrapping process
        const result = await this.$axios.post("/api/unwrap-nft", {
          token_id: this.selectedNFTId,
        });
        console.log(result);
        Swal.fire({
          title: "Congratulations!",
          text: "You unwrapped your NFT",
          icon: "success",
        });
        // Further handling
      } catch (error) {
        console.error("Error during unwrap operation", error);
        this.error = "Failed to unwrap NFT.";
      } finally {
        this.queryNFTs();
        this.loading = false;
      }
    },

    async queryNFTs() {
      this.loading = true;
      try {
        const result = await this.$axios.post("/api/query-nfts", {
          walletAddress: this.walletAddress,
        });
        console.log(result);
        console.log(result.data.queryResult.tokens);
        this.nfts = result.data.queryResult.tokens;
        // Handle the response as needed
      } catch (error) {
        console.error("Error sending data to the server", error);
        this.error = "Failed to send data to the server.";
      }
      this.loading = false;
    },
  },
  watch: {
    selectedNFTId(newVal) {
      console.log("Selected NFT ID:", newVal);
      this.selectedNFTId = newVal;
    },
  },
};
</script>

<style>
html,
body {
  font-family: sans-serif;
  background-color: black;
  box-sizing: border-box;
}
.wrapPage {
  background-color: black;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-sizing: border-box;
}

.tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tabs button {
  margin: 5px;
  margin-top: 15px;
  padding: 10px;
  font-size: 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.mainTitle {
  color: white;
  margin-bottom: 30px;
  font-size: 50px;
}

.dropDown {
  font-size: 20px;
  padding: 5px;
  border-radius: 5px;
  border: none;
  background-color: lightgray;
  cursor: pointer;
}

.collectionText {
  font-size: 25px;
  font-weight: bold;
}

.wrapBox {
  padding: 10px;
  background-color: rgb(0, 193, 49);
  width: 40%;
  height: 40%;
  border-radius: 5%;
  box-shadow: 0px 0px 20px 5px rgb(0, 193, 49);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  overflow: auto;
}

.error {
  color: red;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.selectedTab {
  background-color: rgb(2, 43, 12);
  color: white;
}

.amountBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.amountBox p {
  font-size: 20px;
  margin: 0;
}
.dropdownBox {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
</style>
