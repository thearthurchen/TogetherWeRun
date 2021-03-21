const { expect } = require('chai');

describe('PaymentGateway tests', function () {
  it('Should be able to send and view balance', async function () {
    const [owner, other] = await ethers.getSigners();
    const PaymentGateway = await ethers.getContractFactory('PaymentGateway');
    const pg = await PaymentGateway.deploy(owner.address);

    await pg.deployed();
    await pg.connect(other).sendPayment({ value: 3 });
    expect(await pg.balance()).to.equal(3);
  });
});
