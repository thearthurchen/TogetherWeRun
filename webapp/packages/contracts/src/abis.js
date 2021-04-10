import BetterTogetherGatewayAbi from '../../../../artifacts/contracts/BetterTogetherGateway.sol/BetterTogetherGateway.json'
import PactAbi from '../../../../artifacts/contracts/Pact.sol/Pact.json'
import ChainlinkAbi from './abis/chainlink.json'

const abis = {
  BetterTogetherGateway: BetterTogetherGatewayAbi,
  Pact: PactAbi,
  Link: ChainlinkAbi
}

export default abis
