import { Link } from "react-router-dom";
import {
  HomeOutlined,
  ProductOutlined,
  MenuOutlined,
  AppstoreOutlined,
  BorderOutlined,
} from "@ant-design/icons";
export const menuItems = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: <Link to={"/"}>Dashboard</Link>,
  },
  {
    key: "/models",
    icon: <BorderOutlined />,
    label: <Link to={"/models"}>Models</Link>,
  },

  {
    key: "/categories",
    icon: <MenuOutlined />,
    label: <Link to={"/categories"}>Categories</Link>,
  },
];
