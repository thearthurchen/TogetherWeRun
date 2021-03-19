const { expect } = require("chai");

describe("PaymentGateway tests", function() {
  it("Should be able to send and view balance", async function() {
    const [owner, other] = await ethers.getSigners();
    const BetterTogetherGateway = await ethers.getContractFactory("BetterTogetherGateway");
    const btg = await BetterTogetherGateway.deploy(owner.address);

    await btg.deployed();
  });
});