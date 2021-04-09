import React from 'react';
import { StyledTable } from '.';

const ProgressView = ({ progress }) => {

  return(
    <StyledTable>
        <thead>
            <tr>
                <th>Participant</th>
                <th>Miles</th>
                <th>Goal</th>
            </tr>
        </thead>
        <tbody>
            {progress.map( (miles, idx) =>{
                return (
                    <tr>
                        <td>{idx + 1}</td>
                        <td>{miles}</td>
                        <td>20</td>
                    </tr>
                )
            })}
        </tbody>
    </StyledTable>
  )
}

export default ProgressView;