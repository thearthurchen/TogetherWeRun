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
              <td>{Number(progress[key].toNumber()/16090).toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </StyledTable>
  );
};

export default ProgressView;
