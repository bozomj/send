import { describe } from "node:test";
import orchestrator from "./orchestrator";

beforeAll(async () => {
  orchestrator.cleanFiles();
});

describe("Files /api/v1/send", () => {
  it("teste success add file and files_metadata", async () => {
    const conteudo = JSON.stringify("Olá, mundo!");
    const meuBlob = new Blob([conteudo], { type: "text/plain" });

    const formData = new FormData();
    const file = new File([meuBlob], "nome do meu aruivo.txt", {
      type: meuBlob.type,
    });

    formData.append("file", file);

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER}/api/v1/send`,
      {
        method: "POST",
        body: formData,
        headers: {
          "x-test-ip": "203.0.113.195",
          "user-agent": "Jest-Test-Agent",
        },
      },
    );

    const { fileInfo, metadata } = await result.json();

    expect(result.status).toBe(201);
    expect(fileInfo.id).toBe(1);
    expect(fileInfo.status).toEqual("pending");
    expect(new Date(fileInfo.expires_at).getTime()).toBeGreaterThan(
      new Date().getTime(),
    );

    expect(metadata.file_id).toBe(fileInfo.id);
  });

  it("teste fail add file and files_metadata whit id diference", async () => {
    const conteudo = JSON.stringify("Olá, mundo!");
    const meuBlob = new Blob([conteudo], { type: "text/plain" });

    const formData = new FormData();
    const file = new File([meuBlob], "nome do meu aruivo.txt", {
      type: meuBlob.type,
    });

    formData.append("file", file);

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER}/api/v1/send`,
      {
        method: "POST",
        body: formData,
        headers: {
          "x-test-ip": "203.0.113.195",
          "user-agent": "Jest-Test-Agent",
        },
      },
    );

    const { fileInfo, metadata } = await result.json();

    expect(result.status).toBe(500);
    expect(fileInfo.id).toBe(1);
    expect(fileInfo.status).toEqual("pending");
    expect(new Date(fileInfo.expires_at).getTime()).toBeGreaterThan(
      new Date().getTime(),
    );

    expect(metadata.file_id).toBe(fileInfo.id);
  });
});
