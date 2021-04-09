import React from 'react'
import { StyledTable } from '.'
import { ethers } from 'ethers'

const PledgeView = ({ pledges }) => {
  return (
    <StyledTable>
      <thead>
        <tr>
          <th>Participant</th>
          <th>Pledge</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(pledges).map(key => {
          return (
            <tr>
              <td>{key}</td>
              <td>{ethers.utils.formatEther(pledges[key])}</td>
            </tr>
          )
        })}
      </tbody>
    </StyledTable>
  )
}

export default PledgeView
