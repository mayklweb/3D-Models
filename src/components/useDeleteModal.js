import { useDeleteRequest } from '@/services/request'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { Modal } from 'antd'

function useDeleteModal() {
  const deleteRequest = useDeleteRequest()

  return async (deleteUrl, reload) => (
    Modal.confirm({
      title: 'Are you sure delete this Item?',
      icon: <ExclamationCircleFilled />,
      content: 'Some descriptions',
      okText: 'Yes',
      okType: 'danger',
      canclText: 'No',
      async onOk() {
        await deleteRequest.request({ url: deleteUrl })
        reload()
        console.log('ok');
        console.log(reload)
      },
      onCancel() {
      }
    })
  )
}

export default useDeleteModal