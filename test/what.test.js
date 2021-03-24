const { expect } = require('chai')

describe('What tests', function () {
  it('Test string slicing', async function () {
    const [owner] = await ethers.getSigners()
    const What = await ethers.getContractFactory('What')
    const what = await What.deploy()

    await what.deployed()
    console.log(await what.getInviteCode())
  })
})
