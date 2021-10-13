const truffleAssert = require('truffle-assertions');
const contractTruffle = require('truffle-contract');
const { toWei, toBN, fromWei } = web3.utils;

/* CheckDotToken Provider */
const checkdotTokenArtifact = require('../../CheckDot.CheckDotERC20Contract/build/contracts/CheckDot.json');
const CheckdotTokenContract = contractTruffle(checkdotTokenArtifact);
CheckdotTokenContract.setProvider(web3.currentProvider);

/* CheckDotPrivateSale Artifact */
const CheckDotPrivateSaleContract = artifacts.require('CheckDotPrivateSale');

contract('CheckDotPrivateSale', async (accounts) => {
  let tokenInstance;
  let privateSaleContractInstance;

  let owner;
  let investorOne;

  before(async () => {
    // instances
    tokenInstance = await CheckdotTokenContract.deployed();
    privateSaleContractInstance = await CheckDotPrivateSaleContract.deployed();

    // accounts
    owner = accounts[0];
    investorOne = accounts[1];
  });

  it('should deposit initial pre-sale amount', async () => {

    const privateSaleInitialBalance = await tokenInstance.balanceOf(privateSaleContractInstance.address);
    // initial CDT transfert
    const initialTransferAmount = toWei('10000', 'ether');
    await truffleAssert.passes(tokenInstance.transfer(privateSaleContractInstance.address, initialTransferAmount, { from: owner }), 'initial transfer failed');

    // // store initiator initial CDT balance
    const latestPrivateSaleBalance = await tokenInstance.balanceOf(privateSaleContractInstance.address);

    assert.equal(
        latestPrivateSaleBalance.toString(),
        privateSaleInitialBalance.add(toBN(toWei('10000', 'ether'))).toString(),
        'should contains verification created by initiator'
    );

    const totalRaisedCdt = await privateSaleContractInstance.getTotalRaisedCdt({ from: owner });

    assert.equal(
        totalRaisedCdt.toString(),
        toWei('0', 'ether'),
        'should contains verification created by initiator'
    );
  });

  it('should be 1 invest eth equals to 500 cdt raised', async () => {
    await truffleAssert.passes(privateSaleContractInstance.send(toWei('1', 'ether'), { from: investorOne }), 'invest transfer failed');

    const totalRaisedCdt = await privateSaleContractInstance.getTotalRaisedCdt({ from: owner });

    assert.equal(
        totalRaisedCdt.toString(),
        toWei('500', 'ether'),
        'totalRaisedCdt in sale contract should be equals 500 CDT'
    );

    const totalRaisedEth = await privateSaleContractInstance.getTotalRaisedEth({ from: owner });

    assert.equal(
        totalRaisedEth.toString(),
        toWei('1', 'ether'),
        'totalRaisedEth in sale contract should be equals 1 ETH'
    );

    await privateSaleContractInstance.setClaim(true, { from: owner });

    assert.equal(
        await privateSaleContractInstance._claim({ from: owner }),
        true,
        'claim should be true'
    );

    const investorInitialOneBalance = await tokenInstance.balanceOf(investorOne);

    await privateSaleContractInstance.claimCdt({ from: investorOne });

    const latestInvestorOneBalance = await tokenInstance.balanceOf(investorOne);

    assert.equal(
        latestInvestorOneBalance.toString(),
        investorInitialOneBalance.add(toBN(toWei('500', 'ether'))).toString(),
        'investorOne CDT balance should be equals 500 CDT'
    );

    // 500 back to owner (only for testing)
    const investedTransferAmount = toWei('500', 'ether');
    await truffleAssert.passes(tokenInstance.transfer(owner, investedTransferAmount, { from: investorOne }), 'sending invested fund to owner');
  });

  it('withdraw owner', async () => {
    const ownerInitialBalance = await tokenInstance.balanceOf(owner);

    await privateSaleContractInstance.withdraw({ from: owner });

    const latestOwnerBalance = await tokenInstance.balanceOf(owner);

    assert.equal(
        latestOwnerBalance.toString(),
        ownerInitialBalance.add(toBN(toWei('9500', 'ether'))).toString(),
        'owner CDT balance should be equals 9500 CDT'
    );

    const ownerEthInitialBalance = await web3.eth.getBalance(owner);

    const receipt = await privateSaleContractInstance.withdraw({ from: owner });
    // Obtain gasUsed
    const gasUsed = receipt.receipt.gasUsed;

    // Obtain gasPrice from the transaction
    const tx = await web3.eth.getTransaction(receipt.tx);
    const gasPrice = tx.gasPrice;

    const latestEthOwnerBalance = await web3.eth.getBalance(owner);

    assert.equal(
        toBN(latestEthOwnerBalance).add(toBN(gasPrice).mul(toBN(gasUsed))).toString(),
        ownerEthInitialBalance.toString(),
        'owner CDT balance should be equals 1 ETH'
    );
  });
});