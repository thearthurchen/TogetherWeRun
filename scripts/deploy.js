const snooze = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  // Get an account note this is an object; maybe we should use TS
  // https://github.com/ethers-io/ethers.js/issues/1051
  // You need to pass the address of the accounts
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  let escrowFactoryAddress = "";
  let factory;
  if (escrowFactoryAddress === "") {
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.deploy({
      gasLimit: 12000000,
    });
    console.log("EscrowFactory deployed to: ", factory.address);
    escrowFactoryAddress = factory.address;
  }

  await snooze(10000);

  const Gateway = await ethers.getContractFactory("BetterTogetherGateway");
  const gateway = await Gateway.deploy(escrowFactoryAddress, {
    gasLimit: 12000000,
  });
  console.log("BetterTogetherGateway deployed to: ", gateway.address);
  await snooze(10000);
  await factory.transferOwnership(gateway.address);
  console.log("Factory owner is: ", await factory.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
