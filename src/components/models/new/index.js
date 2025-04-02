"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { fetchCategories, createCar } from "@/lib/api";

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function NewCarPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        message.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await createCar({
        name: values.name,
        categoryId: values.categoryId,
        description: values.description,
        year: values.year,
        price: values.price,
      });

      message.success("Car created successfully");
      router.push("/dashboard/models");
    } catch (error) {
      console.error("Error creating car:", error);
      message.error("Failed to create car");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <Title level={2}>Add New Car</Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            year: new Date().getFullYear(),
          }}
        >
          <Form.Item
            name="name"
            label="Car Name"
            rules={[{ required: true, message: "Please enter the car name" }]}
          >
            <Input placeholder="Enter car name" />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select placeholder="Select a category" loading={loading}>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="year" label="Year">
            <InputNumber style={{ width: "100%" }} placeholder="Enter year" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter description" />
          </Form.Item>

          <Form.Item className="form-actions">
            <Button onClick={() => router.back()} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add Car
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
