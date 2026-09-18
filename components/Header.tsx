import { faCloudUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header: React.FC = () => {
  return (
    <header className="border-b text-slate-700 border-gray-300 p-2">
      <a href="/" className="flex items-end gap-2">
        <FontAwesomeIcon icon={faCloudUpload} size={"2xl"} />
        <span> bzmjsend.com.br </span>
      </a>
    </header>
  );
};

export default Header;
