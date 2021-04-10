require('@nomiclabs/hardhat-waffle')
require('hardhat-deploy')
require('dotenv').config()
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()
  accounts.forEach((account) => {
    console.log(account.address)
  })
})

console.log({
  url: process.env.KOVAN_RPC_URL,
  accounts: [process.env.PRIVATE_KEY],
  saveDeployments: true,
  allowUnlimitedContractSize: true
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
      gas: 12500000,
      blockGasLimit: 0x1fffffffffffff
    },
    kovan: {
      url: process.env.KOVAN_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      saveDeployments: true,
      // allowUnlimitedContractSize: true,
      gas: 12500000,
      blockGasLimit: 0x1fffffffffffff
    }
  },
  solidity: '0.6.12'
}
