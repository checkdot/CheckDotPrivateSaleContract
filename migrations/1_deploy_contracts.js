const CheckDotPrivateSale = artifacts.require("CheckDotPrivateSale");

module.exports = function(deployer) {
  const networks = {
    '1': '0x1dCF92BfA88082d1c5FE57e93df21Aa82396CF5a',
    '3': '0xB5426AF00DEd584F337a0fb3990577Dce4AD2027',
    '5777': '0x79deC2de93f9B16DD12Bc6277b33b0c81f4D74C7'
  };
  const checkdotTokenAddress = networks['3'];
  const cdtPerEth = web3.utils.toWei('500', 'ether');
  const maxEthPerWallet = web3.utils.toWei('5', 'ether');

  deployer.deploy(CheckDotPrivateSale, checkdotTokenAddress, cdtPerEth, maxEthPerWallet);
};