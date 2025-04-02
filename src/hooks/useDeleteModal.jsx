import { ExclamationCircleFilled } from "@ant-design/icons";
import { Modal } from "antd";
import { useDeleteRequest } from "./request";

function useDeleteModal() {
  const deleteRequest = useDeleteRequest();
  const [modal, contextHolder] = Modal.useModal();
  return async (deleteUrl, reload) =>
    Modal.confirm({
      title: "Are you sure you want to delete this item?",
      icon: <ExclamationCircleFilled />,
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No", // Fixed typo

      async onOk() {
        try {
          await deleteRequest.request({ url: deleteUrl });
          console.log("Deleted:", deleteUrl);
          await reload(); // Ensure it's awaited if it's async
        } catch (error) {
          console.error("Delete failed:", error);
        }
      },

      onCancel() {
        console.log("Delete canceled");
      },
    });
}

export default useDeleteModal;
