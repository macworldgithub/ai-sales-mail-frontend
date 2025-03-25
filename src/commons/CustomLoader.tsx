import { Spin } from "antd";
const CustomLoader = () => {
  return (
    <div className="min-h-screen top-0 left-0 fixed z-[999999999999999999px] h-full w-full flex justify-center items-center">
      <Spin />
    </div>
  );
};

export default CustomLoader;
