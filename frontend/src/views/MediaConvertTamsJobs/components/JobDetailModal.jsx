import { Modal, TextContent } from "@cloudscape-design/components";

const JobDetailModal = ({ modalVisible, setModalVisible, selectedItem }) => {
  const handleDismiss = async () => {
    setModalVisible(false);
  };

  return (
    <Modal
      onDismiss={handleDismiss}
      visible={modalVisible}
      header="Job Details"
    >
      <TextContent>
        <code style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>{JSON.stringify(selectedItem, null, 2)}</code>
      </TextContent>
    </Modal>
  );
};

export default JobDetailModal;
