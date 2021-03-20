const { expect } = require("chai");

describe("BetterTogetherGateway", function() {

  let owner;
  let other;
  let BetterTogetherGateway
  let gateway;

  beforeEach(async function() {
    [owner, other] = await ethers.getSigners();
    BetterTogetherGateway = await ethers.getContractFactory("BetterTogetherGateway");
    gateway = await BetterTogetherGateway.deploy(owner.address);
    await gateway.deployed();
    gateway.on("*", event => {
      console.log(event);
    });
  })

  it("Should only be able to create once per sender and get invite code", async function() {
    // Create a Better Together
    await gateway.weAreBetterTogether();
    try {
      await gateway.weAreBetterTogether();
    } catch (e) {
      expect(e.toString()).to.equal("Error: VM Exception while processing transaction: revert You already have a pact!");;
    }
    // Check inviteCode
    const inviteCode = await gateway.getInviteCode();
    // TODO change the value to whatever seed we pass it or something
    expect(inviteCode).to.equal("Hello");
  });

  it("Should be able to have betterness defined", async function() {
    // Create a Better Together
    await gateway.connect(other).weAreBetterTogether();
    const pactAddress = await gateway.connect(other).getMyPact();
    console.log(pactAddress);
    // Define what it means to be better
    await gateway.connect(other).defineBetterness(1, Date.now(), 10);
  });
});