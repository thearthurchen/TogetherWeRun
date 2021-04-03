import { Contract } from "@ethersproject/contracts";
import { addresses, abis } from "@project/contracts";
// test function to read chain data
export async function getRoles(provider, pactAddress) {

  // Need to know address of pact
  // Currently pact address is only gettable by host
  // TODO: Possibly expose a way to get pact address on BTGateway
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  let roles;
  let host;
  try{
    roles = await pact.getParticipants();
    host = await pact.getHost();
    console.log('roles', roles)
    console.log('host', host);
  } catch(e) {
    console.log(e);
  }
}

export async function myPact(provider) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);
  const signer = provider.getSigner();
  try {
    const resp = await gateway.connect(signer).getMyPact();
    console.log('Pact Address', resp);

  } catch(e) {
    console.log(e);
  }
}

// TODO: Create invite code function to pass in
export async function createPact(provider, inviteCode) {
  const signer = provider.getSigner();
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider);

  try {
    await gateway.connect(signer).createPact(inviteCode);
    gateway.on("PactCreated", (host, id, event)=> {
      console.log(`${host} created pact with pact id: ${id}`)
      console.log(event)
    })
  } catch (e) {
    console.log(e);
  }
}

export async function joinPact(provider, pactAddress, hostAddress, inviteCode) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider);
  const signer = provider.getSigner();

  try {
    //joinPact(hostAddress, inviteCode)
    await pact.connect(signer).joinPact('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', inviteCode);
    pact.on("Deposited", (from, value)=> {
      console.log(`${from} joined pact and sent ${value}`);
    })
  } catch(e) {
    console.log(e);
  }

}
