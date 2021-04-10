import React from "react";
import { StyledTable } from ".";
import { ethers } from "ethers";

const ProgressView = ({ progress }) => {
  return (
    <StyledTable>
      <thead>
        <tr>
          <th>Participant</th>
          <th>Miles</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(progress).map((key, idx) => {
          return (
            <tr key={idx}>
              <td>{key}</td>
              <td>{ethers.utils.formatEther(progress[key])}</td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
};

export default ProgressView;
