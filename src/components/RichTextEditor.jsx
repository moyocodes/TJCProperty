import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function RichTextEditor({ value, onChange, disabled }) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        readOnly={disabled}
      />
    </div>
  );
}
