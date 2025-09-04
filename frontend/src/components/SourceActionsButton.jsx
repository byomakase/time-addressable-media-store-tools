import { useState } from "react";
import { ButtonDropdown } from "@cloudscape-design/components";
import SourceActionsModal from "@/components/SourceActionsModal";

const SourceActionsButton = ({ selectedItems }) => {
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
            text: "Create MediaConvert Job",
            id: "create-export",
            disabled: selectedItems.length !== 1,
          },
        ]}
      >
        Actions
      </ButtonDropdown>
      <SourceActionsModal
        selectedItems={selectedItems}
        actionId={actionId}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </>
  );
};

export default SourceActionsButton;
