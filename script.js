const API_URL = "http://127.0.0.1:3000/api/produtos/cadastrar";

const form = document.querySelector("#product-form");
const photoInput = document.querySelector("#foto");
const previewContainer = document.querySelector("#image-preview");
const previewImage = document.querySelector("#preview-image");
const previewStatus = document.querySelector("#preview-status");
const feedback = document.querySelector("#feedback");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");

function showFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback visible ${type}`;
}

function clearFeedback() {
  feedback.textContent = "";
  feedback.className = "feedback";
}

function setLoading(loading) {
  submitButton.disabled = loading;
  clearButton.disabled = loading;
  submitButton.classList.toggle("is-loading", loading);
  submitButton.querySelector(".button-label").textContent =
    loading ? "Enviando..." : "Cadastrar produto";
}

function clearPreview() {
  previewImage.removeAttribute("src");
  previewContainer.hidden = true;
  previewStatus.textContent = "Prévia da imagem";
}

photoInput.addEventListener("input", () => {
  clearFeedback();
  const url = photoInput.value.trim();

  if (!url) {
    clearPreview();
    return;
  }

  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocolo inválido");
    }
    previewImage.src = url;
    previewContainer.hidden = false;
    previewStatus.textContent = "Carregando prévia...";
  } catch {
    clearPreview();
  }
});

previewImage.addEventListener("load", () => {
  previewStatus.textContent = "Prévia da imagem";
});

previewImage.addEventListener("error", () => {
  previewStatus.textContent = "Não foi possível carregar a prévia. Confira a URL.";
});

form.addEventListener("reset", () => {
  clearFeedback();
  clearPreview();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();

  const nomeproduto = document.querySelector("#nomeproduto").value.trim();
  const categoria = document.querySelector("#categoria").value.trim();
  const descricao = document.querySelector("#descricao").value.trim();
  const precoText = document.querySelector("#preco").value;
  const preco = Number(precoText);
  const foto = photoInput.value.trim();

  if (!nomeproduto || !categoria || precoText === "") {
    return showFeedback("Preencha nome, categoria e preço.", "error");
  }

  if (!Number.isFinite(preco) || preco < 0) {
    return showFeedback("Informe um preço válido, igual ou maior que zero.", "error");
  }

  if (foto) {
    try {
      const parsedUrl = new URL(foto);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("URL inválida");
      }
    } catch {
      return showFeedback("Informe uma URL válida começando com http:// ou https://.", "error");
    }
  }

  // O controller recebe a foto em req.body.foto, por isso enviamos JSON.
  const produto = {
    nomeproduto,
    categoria,
    descricao,
    preco: Number(preco.toFixed(2)),
    foto: foto || null
  };

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(produto)
    });

    const rawResponse = await response.text();
    let data;
    try {
      data = rawResponse ? JSON.parse(rawResponse) : null;
    } catch {
      data = rawResponse;
    }

    if (!response.ok) {
      const message = data && typeof data === "object"
        ? (data.message || data.erro)
        : data;
      throw new Error(message || `Erro HTTP ${response.status}`);
    }

    const message = data && typeof data === "object" && data.message
      ? data.message
      : "Produto cadastrado com sucesso!";

    form.reset();
    showFeedback(message, "success");
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);

    if (error instanceof TypeError) {
      showFeedback(
        "Não foi possível conectar à API. Confira se o servidor está ativo e se o CORS permite esta origem.",
        "error"
      );
    } else {
      showFeedback(`Não foi possível cadastrar: ${error.message}`, "error");
    }
  } finally {
    setLoading(false);
  }
});
