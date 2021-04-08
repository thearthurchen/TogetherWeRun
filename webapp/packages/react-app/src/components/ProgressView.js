import React from 'react';
import { StyledTable } from '.';

const ProgressView = () => {

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
            <tr>
                <td>1</td>
                <td>10</td>
                <td>20</td>
            </tr>
            <tr className="active-row">
                <td>2 </td>
                <td>5</td>
                <td>20</td>
            </tr>
            <tr>
                <td>3</td>
                <td>2</td>
                <td>20</td>
            </tr>
        </tbody>
    </StyledTable>
  )
}

export default ProgressView;