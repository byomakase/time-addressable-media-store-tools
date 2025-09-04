import { useState } from "react";
import { AWS_FFMPEG_ENDPOINT } from "@/constants";
import { ButtonDropdown } from "@cloudscape-design/components";
import FlowActionsModal from "@/components/FlowActionsModal";

const FlowActionsButton = ({ selectedItems }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [actionId, setActionId] = useState("");

  const handleOnClick = ({ detail }) => {
    setActionId(detail.id);
    setModalVisible(true);
  };

  return (
    <>
      <ButtonDropdown
        onItemClick={handleOnClick}
        disabled={selectedItems.length === 0}
        expandableGroups
        items={[
          {
            text: "Delete",
            id: "delete",
            disabled: !(selectedItems.length > 0),
          },
          {
            text: "Timerange delete",
            id: "timerange",
            disabled: !(selectedItems.length > 0),
          },
          AWS_FFMPEG_ENDPOINT
            ? {
                text: "FFmpeg",
                id: "ffmpeg",
                disabled:
                  selectedItems.length === 0 ||
                  selectedItems.some((item) => !item.container),
                disabledReason:
                  selectedItems.some((item) => !item.container) &&
                  "The container property must have a value on all selected flows.",
                items: [
                  {
                    text: "Create FFmpeg Export",
                    id: "create-export",
                  },
                  {
                    text: "Create FFmpeg Rule",
                    id: "create-rule",
                    disabled: selectedItems.length !== 1,
                  },
                  {
                    text: "Create FFmpeg Job",
                    id: "create-job",
                    disabled: selectedItems.length !== 1,
                  },
                ],
              }
            : {},
        ]}
      >
        Actions
      </ButtonDropdown>
      <FlowActionsModal
        selectedItems={selectedItems}
        actionId={actionId}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </>
  );
};

export default FlowActionsButton;
