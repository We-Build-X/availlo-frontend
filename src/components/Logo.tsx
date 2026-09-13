import LogoBlue from "@/assets/logo-blue.webp";
const Logo = () => {
  return (
    <a href="/" className=" space-x-0 inline-flex items-center">
      <img
        src={LogoBlue}
        width={256}
        height={256}
        alt="Availlo"
        className="w-12 md:w-14"
      />
      <h2 className="font-bold text-2xl cursor-pointer">Availlo</h2>
    </a>
  );
};

export default Logo;
