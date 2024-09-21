import libheif from "libheif-js/wasm-bundle";

const fileInput = document.querySelector<HTMLInputElement>("#file")!;

const leftImg = document.querySelector<HTMLImageElement>("#left")!;
const rightImg = document.querySelector<HTMLImageElement>("#right")!;

type HeifImageData = {
  get_width: () => number;
  get_height: () => number;
  display: (imageData: ImageData, callback: (displayData: any) => void) => void;
};

fileInput.onchange = () => {
  const file = fileInput.files?.[0];
  if (file) {
    readFile(file).then(async (images) => {
      const [leftUrl, rightUrl] = await Promise.all([
        dataUrlFromHeif(images[1]),
        dataUrlFromHeif(images[2]),
      ]);
      leftImg.src = leftUrl;
      rightImg.src = rightUrl;
    });
  }
};

const readFile = (file: File) => {
  return new Promise<HeifImageData[]>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const decoder = new libheif.HeifDecoder();
      resolve(decoder.decode(reader.result) as HeifImageData[]);
    };
    reader.readAsArrayBuffer(file);
  });
};

const displayOnCanvas = (
  image: HeifImageData,
  canvas: HTMLCanvasElement
): Promise<void> => {
  const context = canvas.getContext("2d")!;
  const width = image.get_width();
  const height = image.get_height();
  canvas.width = width;
  canvas.height = height;
  const imageData = context.createImageData(width, height);

  return new Promise((resolve) => {
    image.display(imageData, (displayData: any) => {
      if (!displayData) {
        throw new Error("HEIF processing error");
      }
      context.putImageData(imageData, 0, 0);
      resolve();
    });
  });
};

const dataUrlFromHeif = async (image: HeifImageData) => {
  const canvas = document.createElement("canvas");
  await displayOnCanvas(image, canvas);
  return canvas.toDataURL();
};
