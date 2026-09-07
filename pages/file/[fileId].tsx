import { downloadFile } from "@/storage/cloudflare/r2Cliente";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

interface FileProps {
  fileId: string;
}

const File = () => {
  const params = useParams();
  const file_id = params?.fileId ?? "";

  const url = `${process.env.NEXT_PUBLIC_SERVER}/api/v1/download/${file_id}`;

  const shareWhatsApp = async () => {
    const urli = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
    console.log(urli);
    // window.open(urli, "_blank");
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <main className="flex w-full h-full items-center justify-center ">
      <div className="w-md flex flex-col gap-4 items-center p-2 ">
        <h1 className="text-2xl font-bold">Arquivo disponível</h1>

        <QRCodeSVG value={url} className="w-7/10 h-7/10" />

        <p className="text-center">Escaneie o QR Code para baixar o arquivo.</p>

        <a
          href={url}
          className="rounded text-center bg-sky-800 font-bold px-5 w-full py-2 text-white"
        >
          Baixar arquivo
        </a>

        <div className="flex w-full  gap-3">
          <button
            onClick={shareWhatsApp}
            className="rounded bg-green-500 flex-1 px-4 py-2 text-white"
          >
            Compartilhar no WhatsApp
          </button>

          <button
            onClick={copyUrl}
            className="rounded bg-gray-700 px-4 py-2 text-white"
          >
            Copiar URL
          </button>
        </div>
      </div>
    </main>
  );
};

export default File;
