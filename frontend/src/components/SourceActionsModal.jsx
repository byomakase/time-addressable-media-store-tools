import SourceCreateExportModal from "@/components/SourceCreateExportModal";

const SourceActionsModal = ({
  selectedItems,
  actionId,
  modalVisible,
  setModalVisible,
}) => {
  return {
    "create-export": (
      <SourceCreateExportModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedSourceId={selectedItems.length > 0 ? selectedItems[0].id : ""}
      />
    ),
  }[actionId];
};

export default SourceActionsModal;
