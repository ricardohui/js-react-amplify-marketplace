import React from "react";

const Error = ({ errors }) => (
  <pre className="error">
    {errors.map((err, i) => (
      <div key={i}>{err.messsage}</div>
    ))}
  </pre>
);

export default Error;
