import { Box, Spinner } from "@cloudscape-design/components";
import { useEffect, useState } from "react";

import Mermaid from "./components/Mermaid";
import { get } from "aws-amplify/api";
import { useParams } from "react-router-dom";

const Diagram = () => {
  const { type, id } = useParams();
  const [chart, setChart] = useState("");

  useEffect(() => {
    const getMermaid = async () => {
      try {
        const restOperation = get({
          apiName: "Mermaid",
          path: `/mermaid/${type}/${id}`,
        })
          .response.then((res) => res.body)
          .then((body) => body.text());
        const response = await restOperation;
        setChart(response);
      } catch (err) {
        console.log("error fetching data: ", err);
      }
    };
    getMermaid();
  }, [type, id]);

  return <Box textAlign="center">{chart ? <Mermaid chart={chart} /> : <Spinner size="large" />}</Box>;
};

export default Diagram;
