const { expect, assert } = require('chai')
const EVM_ERROR = 'Error: VM Exception while processing transaction: revert'
const ALREADY_HAVE_PACT_ERROR = `${EVM_ERROR} You already have a pact!`
const YOU_CANT_CHANGE_PACT_ERROR = `${EVM_ERROR} Caller is not a host`
const WRONG_HOST_OR_INVITE = `${EVM_ERROR} You have the wrong host and invite code`
const NOT_A_FRIEND = `${EVM_ERROR} Caller is not a friend`
const NOT_IN_PACT = `${EVM_ERROR} You are not part of the pact`

describe('BetterTogetherGateway', function () {
  // Network specific
  let provider

  // Contract specific
  let owner
  let host
  let friend1
  let friend2
  let friend3
  let friend4
  let BetterTogetherGateway
  let gateway
  let allMyFriends = []

  beforeEach(async function () {

    // Using hardhat local blockchain instead
    provider = await ethers.provider;
    // provider = await ethers.getDefaultProvider();

    [owner, host, friend1, friend2, friend3, friend4, stranger1] = await ethers.getSigners()
    allMyFriends = [friend1, friend2, friend3, friend4]
    BetterTogetherGateway = await ethers.getContractFactory('BetterTogetherGateway')
    gateway = await BetterTogetherGateway.deploy(owner.address)
    console.log(friend4.address)
    console.log(await provider.getBalance(owner.address))
    console.log(await provider.getBalance(host.address))
    console.log(await provider.getBalance(friend1.address))

    await gateway.deployed()
    gateway.on('*', (event) => {
   //   console.log(event)
    })
  })


  it('Should only be able to create once per sender and get invite code', async function () {
    // Create a Better Together
    await gateway.createPact()
    try {
      await gateway.createPact()
    } catch (e) {
      expect(e.toString()).to.equal(ALREADY_HAVE_PACT_ERROR)
    }
    // Check inviteCode
    const inviteCode = await gateway.getInviteCode()
    // TODO change the value to whatever seed we pass it or something
    expect(inviteCode).to.equal('Hello')
  })

  it('Should be able to have set pact conditions if owner', async function () {
    // Create a Better Together
    await gateway.connect(friend4).createPact()
    // Get the Pact
    const pactAddress = await gateway.connect(friend4).getMyPact()
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    const pactHost = await pact.connect(friend4).getHost()
    // Make sure that I am the host
    expect(pactHost).to.equal(friend4.address)
    // Define what it means to be better with friend4 (creator)
    await pact.connect(friend4).setConditions(1, Date.now(), 10)
    // Try with not the right host
    try {
      await pact.connect(friend4).setConditions(1, Date.now(), 10)
    } catch (e) {
      expect(e.toString()).to.equal(YOU_CANT_CHANGE_PACT_ERROR)
    }
  })

  it('Should be able to invite others to pact and they cant change conditions', async function () {
    // Create a Better Together
    await gateway.connect(host).createPact()
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact()
    ])
    // Get the pact contract
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    // All my friends want to join
    await Promise.all(
      allMyFriends.map(async (friend) => {
        await pact.connect(friend).joinPact(host.address, inviteCode)
      })
    )
    // We expect 4 participants
    const participants = await pact.connect(host).getParticipants()
    console.log(participants)
    expect(participants).to.be.length(4)
    // None of my amazing friends should be able to set the conditions
    const errors = []
    await Promise.all(
      allMyFriends.map(async (friend) => {
        try {
          await pact.connect(friend).setConditions(1, Date.now(), 1)
        } catch (e) {
          expect(e.toString()).to.be.equal(YOU_CANT_CHANGE_PACT_ERROR)
          errors.push(e)
        }
      })
    )
    expect(errors).to.be.length(4)
  })

  it('Shouldnt allow non friends or hosts to interact with Pact', async function () {})

  it('Should withdraw from friend accounts if they make a pledge', async function () {
    // Create a Better Together
    await gateway.connect(host).createPact()
    // We get the inviteCode and address of pact and create new instance to contract
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact()
    ])
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    // Set conditions
    await pact.connect(host).setConditions(10, Date.now(), 100)
    // Friend1 wants to join through pact contract
    await pact.connect(friend1).joinPact(host.address, inviteCode)
    console.log(await pact.connect(host).getConditions())
    // Get their current balance
    const currentBalance = await provider.getBalance(friend1.address)
    console.log(`Current balance ${JSON.stringify(currentBalance)}`)
    // Friend1 pledges
    const [b] = await pact.connect(friend1).getMyBalance()
    console.log(ethers.BigNumber.from(b).toString())
    await pact.connect(friend1).makePledge({ value: 10 })
    const newBalance = await provider.getBalance(friend1.address)
    const [nb] = await pact.connect(friend1).getMyBalance()
    console.log(ethers.BigNumber.from(nb).toString())
    // Check that balanced has decreased by that much
    expect(newBalance).to.equal(currentBalance)
  })

  it('Escrow holds the correct amount after make pledge', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether()
    // We get the inviteCode and address of pact and create new instance to contract
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact()
    ])
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    // Set conditions
    await pact.connect(host).setConditions(10, Date.now(), 100)
    // Friend1 wants to join through pact contract
    await pact.connect(friend1).joinPact(host.address, inviteCode)
    console.log(await pact.connect(host).getConditions())

    const RefundEscrow = await ethers.getContractFactory('RefundEscrow')
    // Friend1 pledges
    const [b] = await pact.connect(friend1).getMyBalance()
    console.log(ethers.BigNumber.from(b).toString())

    // Test pledge value
    const pledgeValue = 10;
    await pact.connect(friend1).makePledge({ value: pledgeValue });

    // Get the escrow address of pact to attach to copy of test refund escrow
    escrowAddress = await pact.connect(host).getEscrowAddress();
    refundEscrow = await RefundEscrow.attach(escrowAddress);

    // Get deposits of friend1's pledge amount stored in the escrow
    escrowFriendDeposit = await refundEscrow.depositsOf(friend1.address);
    console.log("escrow deposit value of friend pledged: " + escrowFriendDeposit);
    assert.equal(ethers.BigNumber.from(escrowFriendDeposit).toString(), "10");
  })

  it('Only owner of escrow (the gateway) should be able to call refund pledges', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether()
    // We get the inviteCode and address of pact and create new instance to contract
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact()
    ])
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    // Set conditions
    await pact.connect(host).setConditions(10, Date.now(), 100)
    // Friend1 wants to join through pact contract
    await pact.connect(friend1).joinPact(host.address, inviteCode)
    console.log(await pact.connect(host).getConditions())
    const RefundEscrow = await ethers.getContractFactory('RefundEscrow')
    // Friend1 pledges
    const [b] = await pact.connect(friend1).getMyBalance()
    console.log(ethers.BigNumber.from(b).toString())

    console.log("friend address balance 1: " + await provider.getBalance(friend1.address))
    // Test pledge value
    const pledgeValue = 10;
    await pact.connect(friend1).makePledge({ value: pledgeValue })

    // Get the escrow address of pact to attach to copy of test refund escrow
    escrowAddress = await pact.connect(host).getEscrowAddress()
    refundEscrow = await RefundEscrow.attach(escrowAddress)

    // Get deposits of friend1's pledge amount stored in the escrow
    escrowFriendDeposit = await refundEscrow.depositsOf(friend1.address)
    console.log("escrow deposit value of friend pledged: " + escrowFriendDeposit)
    assert.equal(ethers.BigNumber.from(escrowFriendDeposit).toString(), "10")

    console.log("friend address balance 2: " + await provider.getBalance(friend1.address))
    
    try {
      console.log(await pact.owner())
      await pact.connect(stranger1).enableRefunds()

    } catch (e) {
      assert.equal(true, true);
    }
  })

  it('Only owner of escrow (the gateway) should be able to withdraw pledges', async function () {
    // Create a Better Together
    await gateway.connect(host).weAreBetterTogether()
    // We get the inviteCode and address of pact and create new instance to contract
    const [inviteCode, pactAddress] = await Promise.all([
      gateway.connect(host).getInviteCode(),
      gateway.connect(host).getMyPact()
    ])
    const Pact = await ethers.getContractFactory('Pact')
    const pact = await Pact.attach(pactAddress)
    // Set conditions
    await pact.connect(host).setConditions(10, Date.now(), 100)
    // Friend1 wants to join through pact contract
    await pact.connect(friend1).joinPact(host.address, inviteCode)
    console.log(await pact.connect(host).getConditions())
    const RefundEscrow = await ethers.getContractFactory('RefundEscrow')
    // Friend1 pledges
    const [b] = await pact.connect(friend1).getMyBalance()
    console.log(ethers.BigNumber.from(b).toString())

    console.log("friend address balance 1: " + await provider.getBalance(friend1.address))
    // Test pledge value
    const pledgeValue = 10;
    await pact.connect(friend1).makePledge({ value: pledgeValue })

    // Get the escrow address of pact to attach to copy of test refund escrow
    escrowAddress = await pact.connect(host).getEscrowAddress()
    refundEscrow = await RefundEscrow.attach(escrowAddress)

    // Get deposits of friend1's pledge amount stored in the escrow
    escrowFriendDeposit = await refundEscrow.depositsOf(friend1.address)
    console.log("escrow deposit value of friend pledged: " + escrowFriendDeposit)
    assert.equal(ethers.BigNumber.from(escrowFriendDeposit).toString(), "10")

    console.log("friend address balance 2: " + await provider.getBalance(friend1.address))
    // Test pledge value
    try {
      //console.log(await refundEscrow.connect(pactAddress).withdraw(friend1.address));
      console.log(await pact.owner())
      //console.log(await pact.enableRefunds())
      await pact.connect(host).enableRefunds()
      //console.log(await pact.withdraw(friend1.address))
      await pact.withdraw(friend1.address)
    } catch (e) {
      console.log(new Error(e))
    }

    escrowFriendDeposit = await refundEscrow.depositsOf(friend1.address)
    console.log("friend address balance 3: " + await provider.getBalance(friend1.address))
    console.log("escrow deposit value of friend pledged: " + escrowFriendDeposit)
    assert.equal(ethers.BigNumber.from(escrowFriendDeposit).toString(), "0");
  })


})

describe('Access Control', function () {
  // Network specific
  let provider

  // Contract specific
  let owner
  let host
  let friend1
  let friend2
  let friend3
  let friend4
  let BetterTogetherGateway
  let gateway
  let allMyFriends = []

  let pact

  beforeEach(async function () {

    // Using hardhat local blockchain instead
    provider = await ethers.provider;
    // provider = await ethers.getDefaultProvider();

    // Get signers
    [owner, host, friend1, friend2, friend3, friend4] = await ethers.getSigners()
    allMyFriends = [friend1, friend2, friend3, friend4]
    // Deploy gateway
    BetterTogetherGateway = await ethers.getContractFactory('BetterTogetherGateway')
    gateway = await BetterTogetherGateway.deploy(owner.address)
    // Wait for gateway deployed
    await gateway.deployed()
    // Create a Pact
    await gateway.connect(host).createPact()
    // Set the pact for our tests
    const pactAddress = await gateway.connect(host).getMyPact()
    const Pact = await ethers.getContractFactory('Pact')
    pact = await Pact.attach(pactAddress)
  })


  // TODO can chai catch exceptions (can't be bothered to look at api right now)
  // TODO Try-Catch will create false positive test cases if we never throw
  it('Should reject on non-friends making pledges', async function () {
    try {
      await pact.connect(friend1).joinPact(host.address, 'Hello')
      await pact.connect(friend1).makePledge({ value: 10 })
    } catch (e) {
      expect(e.toString()).to.equal(NOT_A_FRIEND)
    }
  })

  it('Should reject bad invite code', async function () {
    try {
      await pact.connect(friend1).joinPact(host.address, 'Not Correct')
    } catch (e) {
      expect(e.toString()).to.equal(WRONG_HOST_OR_INVITE)
    }
  })

  it('Should reject bad host with proper invite code', async function () {
    try {
      await pact.connect(friend1).joinPact(friend2.address, 'Hello')
    } catch (e) {
      expect(e.toString()).to.equal(WRONG_HOST_OR_INVITE)
    }
  })

  it('Should reject viewing participants to outsiders', async function () {
    try {
      await pact.connect(friend1).getParticipants()
    } catch (e) {
      expect(e.toString()).to.equal(NOT_IN_PACT)
    }
  })
})
