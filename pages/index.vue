<template>
  <div class="container">
    <!-- The tags here should match the names of the components -->
    <WalletConnection />
    <NftWrap />
  </div>
</template>

<script>
// Import your components
import WalletConnection from '~/components/walletConnection.vue'
import NftWrap from '~/components/nftWrap.vue'

export default {
  name: 'IndexPage',
  components: {
    // Register your components for use in the template
    WalletConnection,
    NftWrap
  }
}
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
