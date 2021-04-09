import { Contract } from '@ethersproject/contracts'
import { addresses, abis } from '@project/contracts'
import { ethers } from 'ethers'

// Need to know address of pact
// export async function getRoles(provider, pactAddress) {
//   // Currently pact address is only gettable by host
//   // TODO: Possibly expose a way to get pact address on BTGateway
//   const pact = new Contract(pactAddress, abis.Pact.abi, provider);
//   console.log('pact', pact)
//   let roles;
//   let host;
//   try{
//     roles = await pact.getParticipants();
//     console.log('roles', roles)
//     host = await pact.getHost();
//     console.log('roles', roles)
//     console.log('host', host);
//   } catch(e) {
//     console.log(e);
//   }
// }

export async function getMyPact (provider) {
  const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider)
  const signer = provider.getSigner()
  try {
    const pactAddress = await gateway.connect(signer).getMyPact()
    // console.log('Pact Address', pactAddress);
    return pactAddress
  } catch (e) {
    const { data: { message } } = e
    console.log(message)
    return null
  }
}

// TODO: Create invite code function to pass in
export async function createPact (provider, inviteCode) {
  return new Promise(async (resolve, reject) => {
    const signer = provider.getSigner()
    const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider)
    try {
      gateway.on('PactJoined', (host, pactAddress, event) => {
        console.log(`${host} created pact with pact id: ${pactAddress}`)
        console.log(event)
        gateway.removeAllListeners()
        resolve(pactAddress)
      })
      await gateway.connect(signer).createPact(inviteCode)
    } catch (e) {
      reject(e)
    }
  })
}

// It is now from gateway.connect also emits pact address
export async function joinPact (provider, hostAddress, inviteCode) {
  return new Promise(async (resolve, reject) => {
    const gateway = new Contract(addresses.BetterTogetherGateway.address, abis.BetterTogetherGateway.abi, provider)
    const signer = provider.getSigner()
    try {
      gateway.on('PactJoined', (from, pactAddress, event) => {
        console.log(`${from} joined pact ${pactAddress}`)
        console.log(event)
        gateway.removeAllListeners()
        resolve(pactAddress)
      })
      const tx = await gateway.connect(signer).joinPact(hostAddress, inviteCode)
    } catch (e) {
      reject(e)
    }
  })
}

export async function getPactState (provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  const signer = provider.getSigner()
  try {
    const pactState = await pact.connect(signer).state()
    const hostAddress = await pact.connect(signer).getHost()
    console.log(`Pact state ${pactState} Host ${hostAddress}`)
    return { hostAddress, pactState }
  } catch (e) {
    console.log(e)
  }
}

export async function getParticipants (provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  const signer = provider.getSigner()
  try {
    const participants = await pact.connect(signer).getParticipants()
    console.log(`Participants ${participants}`)
    return participants
  } catch (e) {
    console.log(e)
  }
}

export async function setConditions (provider, pactAddress, minPledge, totalMiles, endDate, daysPerCheck) {
  const signer = provider.getSigner()
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  try {
    const tx = await pact.connect(signer).setConditions(minPledge, totalMiles, endDate, daysPerCheck)
    return await tx.wait()
  } catch (e) {
    console.log(e)
  }
}

export async function getConditions (provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)

  try {
    const conditions = await pact.getConditions()
    // (minPledge, totalMiles, endDateUtc, daysPerCheck)
    const [minPledge, totalMiles, endDateUtc, daysPerCheck] = conditions
    return {
      minPledge,
      totalMiles,
      endDateUtc,
      daysPerCheck
    }
  } catch (e) {
    console.log(e)
  }
}

export async function startPact (provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  const signer = provider.getSigner()
  try {
    const tx = await pact.connect(signer).startPact()
    return await tx.wait()
  } catch (e) {
    console.log(e)
  }
}

export async function makePledge (pledgeAmount, provider, pactAddress) {
  return new Promise(async (resolve, reject) => {
    const pact = new Contract(pactAddress, abis.Pact.abi, provider)
    const signer = provider.getSigner()
    try {
      pact.on('Deposited', (sender, value) => {
        console.log(`${sender} sent ${value}`)
        pact.removeAllListeners()
        resolve(value)
      })
      await pact.connect(signer).makePledge({ value: pledgeAmount })
    } catch (e) {
      reject(e)
    }
  })
}

export async function getProgress (provider, pactAddress) {
  const pact = new Contract(pactAddress, abis.Pact.abi, provider)
  const signer = provider.getSigner()
  try {
    const participants = await pact.connect(signer).getParticipants()
    const progressMap = {}
    const pledgeMap = {}
    await Promise.all(participants.map(async friend => {
      const [progress, pledge] = await pact.connect(friend).getProgress(friend)
      console.log(progress)
      console.log(pledge)
      progressMap[friend] = progress
      pledgeMap[friend] = pledge
    }))
    return { progress: progressMap, pledges: pledgeMap }
  } catch (e) {
    console.log(e)
  }
}
