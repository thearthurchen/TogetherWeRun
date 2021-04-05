const { expect, assert } = require('chai')

describe('Pact tests', function () {
  // Network specific
  let provider

  // Contract specific
  let owner
  let host
  let friend1
  let friend2
  let friend3
  let friend4
  let allMyFriends = []

  let pact

  beforeEach(async function () {
    // Using hardhat local blockchain instead
    provider = await ethers.provider;
    // provider = await ethers.getDefaultProvider();

    // Get signers
    [owner, host, friend1, friend2, friend3, friend4] = await ethers.getSigners()
    allMyFriends = [friend1, friend2, friend3, friend4]
    // Deploy pact
    Pact = await ethers.getContractFactory('Pact')
    pact = await Pact.deploy(owner.address, host.address, 1, 'hello')
    // Wait for pact deployed
    await pact.deployed()
    pact.on('*', (event) => {
      console.log(event)
    })
  })

  it('Goal should be updated and show up', async function () {
    // Set conditions
    await pact.connect(host).setConditions(1, 10, Date.now(), 100)
    console.log('1')
    // Friend1-3 wants to join through pact contract
    await pact.connect(owner).addParticipant(friend1.address)
    await pact.connect(owner).addParticipant(friend2.address)
    await pact.connect(owner).addParticipant(friend3.address)
    console.log('2')
    // Start the pact
    // TODO check Need to start pact for any update to be done
    await pact.connect(host).startPact()
    console.log('3')
    // Fake updates for the friends
    const fakeProgress = {
      [host.address]: 2,
      [friend1.address]: 1,
      [friend2.address]: 2,
      [friend3.address]: 4
    }
    await pact.connect(owner)._updateProgress(host.address, Date.now(), fakeProgress[host.address])
    await pact.connect(owner)._updateProgress(friend1.address, Date.now(), fakeProgress[friend1.address])
    await pact.connect(owner)._updateProgress(friend2.address, Date.now(), fakeProgress[friend2.address])
    await pact.connect(owner)._updateProgress(friend3.address, Date.now(), fakeProgress[friend3.address])
    console.log('4')

    // Friend1 wants to see progress
    const participants = await pact.connect(friend1).getParticipants()
    expect(participants.length).to.equal(4)
    await Promise.all(participants.map(async friend => {
      console.log(await pact.connect(host).getProgress(friend))
      expect(await pact.connect(host).getProgress(friend)).to.equal(fakeProgress[friend])
    }))
    // Finish the pact
    await pact.connect(owner).finishPact();
    // Pact should be finished

    // But refunds should not be enabled because no one finished their goals
  })
})
