import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, SubmitEvent, useState } from "react";

const Home = () => {
  // Estados para gerenciar o arquivo, carregamento e o link de retorno
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const router = useRouter();

  // Função disparada ao clicar em "Compartilhar"
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Por favor, selecione um arquivo primeiro.");
      return;
    }

    setLoading(true);
    setShareLink("");

    const formData = new FormData();
    const fileHeaderBlob = selectedFile.slice(0, 500);
    const nFile = new File([fileHeaderBlob], selectedFile.name, {
      type: selectedFile.type,
    });

    formData.append("file", nFile);
    formData.append("fileSize", selectedFile.size.toString());

    try {
      const response = await fetch("/api/v1/send", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      //manutencao-------------------------------
      // console.log(data);
      // return;
      //manutencao-------------------------------

      if (data.success) {
        const r2Response = await fetch(data.url, {
          method: "PUT", // O R2 exige obrigatoriamente o método PUT
          body: selectedFile, // Aqui enviamos o arquivo original COMPLETO
          headers: {
            "Content-Type": selectedFile.type, // Deve ser idêntico ao ContentType usado no Back-end
          },
        });

        setTimeout(() => {
          router.push(`/file/${data.key}`).catch(() => {
            // Se ainda assim o Next.js falhar, o navegador força o redirecionamento nativo
            window.location.href = `/file/${data.key}`;
          });
        }, 300);
      } else {
        alert(data.error || "Erro ao fazer upload do arquivo.");
      }
    } catch (err) {
      console.log(err);
      alert("Erro na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full h-full p-4 gap-4">
      <form
        className="flex flex-col gap-2 w-full max-w-sm"
        onSubmit={handleSubmit}
      >
        <label className="bg-sky-200 flex flex-col items-center p-6 rounded-md gap-2 cursor-pointer hover:bg-sky-300 transition-colors">
          <div className="bg-sky-800 h-8 w-8 rounded-full text-sky-100 flex justify-center items-center p-4">
            <FontAwesomeIcon icon={faPlus} />
          </div>
          {/* Mostra o nome do arquivo se ele já tiver sido selecionado */}
          <span className="text-center font-medium max-w-xs truncate">
            {selectedFile ? selectedFile.name : "Adicionar arquivo"}
          </span>
          <input
            type="file"
            accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .odt, .zip, .rar, .7z, .tar, .gz, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, application/vnd.oasis.opendocument.text, application/zip, application/x-rar-compressed, application/x-7z-compressed, application/x-tar, application/gzip"
            className="hidden"
            onChange={(e) => getFile(e, setSelectedFile)} // Passa a função de estado
          />
        </label>

        <button
          type="submit"
          disabled={loading || !selectedFile}
          className="bg-sky-800 text-sky-100 px-4 py-2 rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-sky-900 transition-colors"
        >
          {loading ? "Compartilhando..." : "Compartilhar"}
        </button>
      </form>
    </div>
  );
};

// Atualizada para receber o callback do useState
async function getFile(
  e: ChangeEvent<HTMLInputElement>,
  setFile: (file: File | null) => void,
) {
  const files = e.target.files;
  if (!files || files.length === 0) {
    setFile(null);
    return;
  }

  const file = files[0];

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) return;

  const allowedExtensions =
    /(\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.ppt|\.pptx|\.txt|\.odt|\.zip|\.rar|\.7z|\.tar|\.gz)$/i;
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
  ];

  const isValidExtension = allowedExtensions.exec(file.name);
  const isValidMime = allowedMimeTypes.includes(file.type);

  if (!isValidExtension || !isValidMime) {
    alert("Erro: Apenas documentos e arquivos compactados são permitidos!");
    e.target.value = "";
    setFile(null); // Limpa o estado se for inválido
  } else {
    setFile(file); // Salva o arquivo validado no estado do componente
  }
}

export default Home;
