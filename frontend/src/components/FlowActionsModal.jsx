import FlowDeleteModal from "@/components/FlowDeleteModal";
import FlowDeleteTimeRangeModal from "@/components/FlowDeleteTimeRangeModal";
import FlowCreateExportModal from "@/components/FlowCreateExportModal";
import FlowCreateRuleModal from "@/components/FlowCreateRuleModal";
import FlowCreateJobModal from "@/components/FlowCreateJobModal";

const FlowActionsModal = ({
  selectedItems,
  actionId,
  modalVisible,
  setModalVisible,
}) => {
  return {
    delete: (
      <FlowDeleteModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedItems={selectedItems}
      />
    ),
    timerange: (
      <FlowDeleteTimeRangeModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedItems={selectedItems}
      />
    ),
    "create-export": (
      <FlowCreateExportModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedFlowIds={selectedItems.map((item) => item.id)}
      />
    ),
    "create-rule": (
      <FlowCreateRuleModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedFlowId={selectedItems.length > 0 ? selectedItems[0].id : ""}
      />
    ),
    "create-job": (
      <FlowCreateJobModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedFlowId={selectedItems.length > 0 ? selectedItems[0].id : ""}
      />
    ),
  }[actionId];
};

export default FlowActionsModal;
