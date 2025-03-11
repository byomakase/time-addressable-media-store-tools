import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Home = () => {
  const markdown = `
  # TAMS UI

  This simple web application is designed to help visualise the content of the TAMS store.

  You can use the menu area on the left hand side of this page to navigate between different areas of the application.

  - **Sources** shows the current sources in the TAMS store. You are able to select individual items to view more details about them.
  - **Flows** shows the current flows in the TAMS store. You are able to select individual items to view more details about them.

  On each of these pages there is a link at the top which will show you an HLS Player representing your chosen item or a diagram to better visualise the associated TAMS entities.

  - **MediaLive Channels** shows a list of AWS Elemental MediaLive Channels. You can choose to Ingest the channel and/or start/stop the Channel.
  - **MediaConvert Jobs** shows a list of AWS Elemental MediaConvert Jobs. You can choose to Ingest the job.

  > **NOTE**: The Ingest workflow for both MediaLive and MediaConvert uses the HLS manifest file produced by those services to determine how and what to ingest. Therefore only output types of HLS for Channels and Jobs will support ingest.

  ## Special Tags

  ### TAMS Flow Tags

  | Tag Key                  | Type     | Notes |
  | ------------------------ | -------- | ----- |
  | ***flow_status***        | _string_ | Used to control whether the **ENDLIST** line is present in the HLS manifest. Set this tag value to **ingesting** to exclude the line. |
  | ***hls_segments***       | _number_ | Used to limit the number of segments presented in the HLS manifest. Defaults to **150** if tag not set. Use the value **inf** to list all segments. However,listing all segments may result in the generation of the HLS manifest timing out. |
  | ***hls_exclude***        | _bool_   | Used to indicate the flow should be excluded from HLS manifest generation. |

  ### TAMS Source Tags

  | Tag Key                  | Type     | Notes |
  | ------------------------ | -------- | ----- |
  | ***hls_exclude***        | _bool_   | Used to indicate the source should be excluded from HLS manifest generation.
  `;

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};

export default Home;
