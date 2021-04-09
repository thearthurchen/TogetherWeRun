async function main () {
  // Get an account note this is an object; maybe we should use TS
  // https://github.com/ethers-io/ethers.js/issues/1051
  // You need to pass the address of the accounts
  const accounts = await ethers.getSigners()

  // We get the contract to deploy
  // const PaymentGateway = await ethers.getContractFactory('PaymentGateway')
  // const paymentGateway = await PaymentGateway.deploy(accounts[0].address)

  // console.log('PaymentGateway deployed to:', paymentGateway.address)
  // const Gateway = await ethers.getContractFactory('BetterTogetherGateway')

  // This is modified to deploy StravaClient only for now
  const Gateway = await ethers.getContractFactory('BetterTogetherGateway')
  const gateway = await Gateway.deploy()

  console.log("BetterTogetherGateway deployed to: ", gateway.address)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
