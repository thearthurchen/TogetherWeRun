const { expect } = require('chai');

const EVM_ERROR = 'Error: VM Exception while processing transaction: revert';

const ALREADY_HAVE_PACT_ERROR = `${EVM_ERROR} You already have a pact!`;

const YOU_CANT_CHANGE_PACT_ERROR = `${EVM_ERROR} Caller is not a host`;

describe('BetterTogetherGateway', function () {
  // Network specific
  let provider;

  // Contract specific
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
    provider = await ethers.getDefaultProvider();
    [owner, host, friend1, friend2, friend3, friend4] = await ethers.getSigners();
    allMyFriends = [friend1, friend2, friend3, friend4];
    BetterTogetherGateway = await ethers.getContractFactory('BetterTogetherGateway');
    gateway = await BetterTogetherGateway.deploy(owner.address);
    console.log(friend4.address);
    console.log(await provider.getBalance(owner.address));
    console.log(await provider.getBalance(host.address));
    console.log(await provider.getBalance(friend1.address));

    await gateway.deployed();
    gateway.on('*', (event) => {
      console.log(event);
    });
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
    await gateway.connect(friend4).weAreBetterTogether();
    // Get the Pact
    const pactAddress = await gateway.connect(friend4).getMyPact();
    const Pact = await ethers.getContractFactory('Pact');
    const pact = await Pact.attach(pactAddress);
    const pactHost = await pact.connect(friend4).getHost();
    // Make sure that I am the host
    expect(pactHost).to.equal(friend4.address);
    // Define what it means to be better with friend4 (creator)
    await pact.connect(friend4).setConditions(1, Date.now(), 10);
    // Try with not the right host
    try {
      await pact.connect(friend4).setConditions(1, Date.now(), 10);
    } catch (e) {
      expect(e.toString()).to.equal(YOU_CANT_CHANGE_PACT_ERROR);
    }
  });

  it('Should be able to invite others to pact and they cant change conditions', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether();
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact(),
    ]);
    // Get the pact contract
    const Pact = await ethers.getContractFactory('Pact');
    const pact = await Pact.attach(pactAddress);
    // All my friends want to join
    await Promise.all(
      allMyFriends.map(async (friend) => {
        await pact.connect(friend).joinPact(host.address, inviteCode);
      })
    );
    // TODO check participants
    // None of my amazing friends should be able to set the conditions
    const errors = [];
    await Promise.all(
      allMyFriends.map(async (friend) => {
        try {
          await pact.connect(friend).setConditions(1, Date.now(), 1);
        } catch (e) {
          expect(e.toString()).to.be.equal(YOU_CANT_CHANGE_PACT_ERROR);
          errors.push(e);
        }
      })
    );
    expect(errors).to.be.length(4);
  });

  it('Shouldnt allow non friends or hosts to interact with Pact', async function () {});

  it('Should withdraw from friend accounts if they make a pledge', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether();
    // We get the inviteCode and address of pact and create new instance to contract
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact(),
    ]);
    const Pact = await ethers.getContractFactory('Pact');
    const pact = await Pact.attach(pactAddress);
    // Set conditions
    await pact.connect(host).setConditions(10, Date.now(), 100);
    // Friend1 wants to join through pact contract
    await pact.connect(friend1).joinPact(host.address, inviteCode);
    console.log(await pact.connect(host).getConditions());
    // Get their current balance
    const currentBalance = await provider.getBalance(friend1.address);
    console.log(`Current balance ${JSON.stringify(currentBalance)}`);
    // Friend1 pledges
    const [b] = await pact.connect(friend1).getMyBalance();
    console.log(ethers.BigNumber.from(b).toString());
    await pact.connect(friend1).makePledge({ value: 10 });
    const newBalance = await provider.getBalance(friend1.address);
    const [nb] = await pact.connect(friend1).getMyBalance();
    console.log(ethers.BigNumber.from(nb).toString());
    // Check that balanced has decreased by that much
    expect(newBalance).to.equal(currentBalance);
  });
});
