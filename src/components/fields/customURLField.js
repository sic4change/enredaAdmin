import * as React from "react";

const CustomURLField = ({ record = {}, source }) =>{
    const hasUrl = !!record[source];

    const urlElement = (<a href={`http://${record[source]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={ (e) => { e.stopPropagation();} }>
                                {record[source]}
                           </a>);

    const noUrlElement = (<span> - </span>);
    return hasUrl ? urlElement : noUrlElement;
};

export default CustomURLField;
