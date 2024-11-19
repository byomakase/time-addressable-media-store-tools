import mermaid from "mermaid";
import { useEffect } from "react";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "loose",
});

const Mermaid = ({ chart }) => {
  useEffect(() => {
    mermaid.contentLoaded();
  }, []);

  return <div className="mermaid">{chart}</div>;
};

export default Mermaid;
