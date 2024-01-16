<template>
    <div class="wrapPage">
      <h1 class="mainTitle">Plastic Credit Token Swapper</h1>
      <h2 class="secondaryTitle">Turn your plastic credits into IBC compatible CW-20 tokens</h2>
      <div class="wrapBoxCW20">
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
              Swapper
            </button>
            <button
              :class="{ selectedTab: currentTab === 'unwrapper' }"
              @click="currentTab = 'unwrapper'"
            >
              Swap Back
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
                <p>Amount avaliable to wrap: {{ maxAmount }}</p>
                <p>Select amount to wrap:</p>
                <input
                  type="number"
                  v-model="selectedAmount"
                  min="1"
                  :max="maxAmount"
                />
                <button @click="wrapNFT">Wrap NFT</button>
              </div>
              <div class="error" v-if="error">Error: {{ error }}</div>
            </div>
  
            <div v-if="currentTab === 'unwrapper'">
              <h2>Choose from which collection to Swap</h2>
  
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
import { walletQuery } from "../utils/graphQlQuery";
require("dotenv").config();
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
      creditBalances: ref([]),
      error: null,
      selectedId: null,
      selectedAmount: 1, // default amount
      selectedNFTId: null,
      nfts: ref([]),
      currentTab: "wrapper",
      loading: false,
      color: "green", // Color of the spinner
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
    maxAmount() {
      if (this.selectedId !== null) {
        return this.creditBalances[this.selectedId].amountActive;
      }
      return 0;
    },
  },
  methods: {
    async fetchGraphQLData() {
      if (!this.walletAddress) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Wallet not connected, please connect wallet",
          footer: '<a href="#">Why do I have this issue?</a>',
        });
        return;
      }
      this.loading = true;

      try {
        const response = await request(
          "https://testnet.empowerchain.io:3000/",
          walletQuery,
          {
            id: this.walletAddress,
          }
        );
        console.log(response);
        this.creditBalances = response.wallet.creditBalances.nodes;
        this.denom = this.creditBalances[0].creditCollection.denom;
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message,
          footer: '<a href="#">Why do I have this issue?</a>',
        });
      }
      this.loading = false;
    },
  },

  mounted() {
    watch(
      () => this.walletAddress,
      (newAddress, oldAddress) => {
        if (newAddress && newAddress !== oldAddress) {
          this.fetchGraphQLData();
        }
      },
      { immediate: true }
    );
    watch(
      () => this.selectedId,
      (newId, oldId) => {
        if (newId && newId !== oldId) {
          this.denom = this.creditBalances[newId].creditCollection.denom;
          console.log(this.denom);
        }
      },
      { immediate: true }
    );
  },
};
</script>

<style>
.secondaryTitle {
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 30px;
  padding: 0;
  text-align: center;
}

.wrapBoxCW20 {
  padding: 10px;
  background-color: rgb(201, 9, 185);
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
</style>
