import LogoBlue from "@/assets/logo-blue.png";
const Logo = () => {
  return (
    <a href="/" className=" space-x-0 inline-flex items-center">
      <img src={LogoBlue} className="w-12 md:w-14" />
      <h2 className="font-bold text-2xl cursor-pointer">Availlo</h2>
    </a>
  );
};

export default Logo;
