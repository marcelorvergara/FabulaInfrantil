import Image from "next/image";

interface IModalProps {
  onClose: () => void;
  imageSrc: string;
}

export default function Modal({ onClose, imageSrc }: IModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={onClose}>
      <Image
        src={imageSrc}
        width={260}
        height={260}
        style={{ maxWidth: "90%", maxHeight: "90%" }}
        alt="Story image"
      />
    </div>
  );
}
