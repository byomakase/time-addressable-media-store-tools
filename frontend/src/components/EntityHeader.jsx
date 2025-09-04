import {
  Button,
  CopyToClipboard,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useNavigate } from "react-router-dom";

import { AWS_HLS_API_ENDPOINT } from "@/constants";
import SourceActionsButton from "@/components/SourceActionsButton";
import FlowActionsButton from "@/components/FlowActionsButton";

const EntityHeader = ({ type, entity }) => {
  const entityType = `${type.toLowerCase()}s`;
  const navigate = useNavigate();

  const followLink = (e) => {
    e.preventDefault();
    navigate(e.detail.href);
  };

  return (
    <SpaceBetween size="xl" direction="horizontal">
      <span>{type} details</span>
      {AWS_HLS_API_ENDPOINT && (
        <span>
          <Button
            href={`/hlsplayer/${entityType}/${entity.id}`}
            variant="inline-link"
            onFollow={followLink}
          >
            View HLS
          </Button>
          <CopyToClipboard
            copyButtonAriaLabel="Copy Manifest link"
            copyErrorText="Link failed to copy"
            copySuccessText="Link copied"
            textToCopy={`${AWS_HLS_API_ENDPOINT}/${entityType}/${entity.id}/manifest.m3u8`}
            variant="icon"
          />
        </span>
      )}
      <Button
        href={`/player/${entityType}/${entity.id}`}
        variant="inline-link"
        onFollow={followLink}
      >
        View Player
      </Button>
      <Button
        href={`/diagram/${entityType}/${entity.id}`}
        variant="inline-link"
        onFollow={followLink}
      >
        View Diagram
      </Button>
      {
        {
          sources: <SourceActionsButton selectedItems={[entity]} />,
          flows: <FlowActionsButton selectedItems={[entity]} />,
        }[entityType]
      }
    </SpaceBetween>
  );
};

export default EntityHeader;
