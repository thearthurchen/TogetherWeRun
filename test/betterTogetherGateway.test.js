const { expect } = require('chai');

const EVM_ERROR = 'Error: VM Exception while processing transaction: revert';

const ALREADY_HAVE_PACT_ERROR = `${EVM_ERROR} You already have a pact!`;

const YOU_CANT_CHANGE_PACT_ERROR = `${EVM_ERROR} You are not the host you can't change the conditions`;

describe('BetterTogetherGateway', function () {
  let owner;
  let host;
  let friend1;
  let friend2;
  let friend3;
  let friend4;
  let BetterTogetherGateway;
  let gateway;
  let allMyFriends = [];

  beforeEach(async function () {
    [owner, host, friend1, friend2, friend3, friend4] = await ethers.getSigners();
    allMyFriends = [friend1, friend2, friend3, friend4];
    BetterTogetherGateway = await ethers.getContractFactory('BetterTogetherGateway');
    gateway = await BetterTogetherGateway.deploy(owner.address);
    await gateway.deployed();
    // gateway.on('*', (event) => {
    //   console.log(event);
    // });
  });

  it('Should only be able to create once per sender and get invite code', async function () {
    // Create a Better Together
    await gateway.weAreBetterTogether();
    try {
      await gateway.weAreBetterTogether();
    } catch (e) {
      expect(e.toString()).to.equal(ALREADY_HAVE_PACT_ERROR);
    }
    // Check inviteCode
    const inviteCode = await gateway.getInviteCode();
    // TODO change the value to whatever seed we pass it or something
    expect(inviteCode).to.equal('Hello');
  });

  it('Should be able to have set pact conditions if owner', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether();
    const pactAddress = await gateway.connect(host).getMyPact();
    // TODO check address somehow later?
    console.log(pactAddress);
    // Define what it means to be better
    await gateway.connect(host).setPactConditions(1, Date.now(), 10);
  });

  it('Should be able to invite others to pact', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether();
    const inviteCode = await gateway.connect(host).getInviteCode();
    // All my friends want to join
    await Promise.all(
      allMyFriends.map(async (friend) => {
        await gateway.connect(friend).beBetterTogether(inviteCode, host.address);
      })
    );
    // TODO check participants
    // None of my friends should be able to set the conditions
    const errors = [];
    await Promise.all(
      allMyFriends.map(async (friend) => {
        try {
          await gateway.connect(friend).setPactConditions(1, Date.now(), 1);
        } catch (e) {
          expect(e.toString()).to.be.equal(YOU_CANT_CHANGE_PACT_ERROR);
          errors.push(e);
        }
      })
    );
    expect(errors).to.be.length(4);
  });
});
