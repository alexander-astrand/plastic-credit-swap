<template>
  <div>
    <button v-if="walletAddress == null" @click="connectWallet">Connect Wallet</button>
    <div v-if="walletAddress !== null">Connected Wallet: {{ walletAddress }}</div>
  </div>
</template>

<script>
export default {
  computed: {
    walletAddress() {
      return this.$store.state.walletAddress;
    }
  },
  methods: {
    connectWallet() {
      this.$store.dispatch('connectWallet');
    }
  }
};
</script>

