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
  const fileUrl = `${process.env.NEXT_PUBLIC_SERVER}/file/${file_id}`;

  const shareWhatsApp = async () => {
    const urli = `https://wa.me/?text=${encodeURIComponent(fileUrl)}`;
    console.log(urli);
    window.open(urli, "_blank");
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fileUrl);
  };

  return (
    <main className="flex w-full h-full items-center justify-center ">
      <div className="w-md flex flex-col gap-4 items-center p-2 ">
        <QRCodeSVG value={fileUrl} className="w-1/2 h-1/2" />

        <p className="text-center">Escaneie o QR Code para compartilhar.</p>

        <div>
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 flex-col flex gap-2">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>

                <p className="font-black">Atenção</p>
              </div>
              <div>
                <p className="mt-1">
                  Confie neste link apenas se você conhece a pessoa que o
                  enviou.{" "}
                  <span className="text-amber-700 font-black">
                    Evite abrir links recebidos de desconhecidos.
                  </span>
                </p>
              </div>
            </div>
            <a
              href={url}
              className="rounded text-center bg-sky-800 font-bold px-5 w-full py-2 text-white"
            >
              Baixar arquivo
            </a>
          </div>
        </div>

        <div className="flex w-full  gap-3 px-4">
          <button
            onClick={shareWhatsApp}
            className="rounded bg-green-500 flex-1 px-4 py-2 text-white"
          >
            Compartilhar No WhatsApp
          </button>

          <button
            onClick={copyUrl}
            className="rounded bg-gray-400 px-2 py-2 text-white"
          >
            Copiar URL
          </button>
        </div>
      </div>
    </main>
  );
};

export default File;
