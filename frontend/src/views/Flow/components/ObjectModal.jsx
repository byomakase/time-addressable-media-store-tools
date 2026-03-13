import { Modal, Spinner, TextContent } from "@cloudscape-design/components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useObjects } from "@/hooks/useObjects";

const ObjectModal = ({
  modalVisible,
  setModalVisible,
  objectId,
  setObjectId,
}) => {
  const { object, isLoading } = useObjects(objectId);
  const location = useLocation();
  const navigate = useNavigate();

  const handleDismiss = () => {
    setModalVisible(false);
    setObjectId(null);
  };

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    setModalVisible(false);
    setObjectId(null);
    navigate(path);
  };

  return (
    <Modal
      onDismiss={handleDismiss}
      visible={modalVisible}
      header="Referenced By Flows"
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <TextContent>
          <ul>
            {object?.referenced_by_flows.map((item) => {
              const itemPath = `/flows/${item}`;
              const isCurrentPath = location.pathname === itemPath;

              return (
                <li key={item}>
                  {isCurrentPath ? (
                    item
                  ) : (
                    <Link
                      to={itemPath}
                      onClick={(e) => handleLinkClick(e, itemPath)}
                    >
                      {item}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </TextContent>
      )}
    </Modal>
  );
};

export default ObjectModal;
