import { CarOutlined } from "@ant-design/icons";
import { Button, Spin, Table, Typography } from "antd";
import React from "react";
const { Text } = Typography;

function CategoriesTable({ columns, loading, categories, handleAdd }) {
  return (
    <>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "50px 0",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ marginBottom: 16 }}>
                  <CarOutlined style={{ fontSize: 24, opacity: 0.5 }} />
                </div>
                <Text type="secondary">No cars found</Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={handleAdd}>
                    Add your first car
                  </Button>
                </div>
              </div>
            ),
          }}
        />
      )}
    </>
  );
}

export default CategoriesTable;
